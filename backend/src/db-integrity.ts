import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

/* =========================================================
   INMUTABILIDAD A NIVEL DE BASE DE DATOS (REQ-EXP-002.2)

   No hay migraciones (synchronize: true), así que las
   funciones y triggers se instalan al arrancar, en una sola
   transacción y bajo un advisory lock. Es idempotente
   (CREATE OR REPLACE FUNCTION / DROP TRIGGER IF EXISTS +
   CREATE TRIGGER): si alguien borra un trigger, vuelve en
   el siguiente arranque. Si la instalación falla, el
   backend NO arranca.

   Todas las violaciones usan el SQLSTATE propio SG403
   (INTEGRITY_SQLSTATE); DbIntegrityExceptionFilter lo
   traduce a HTTP 403 con el mensaje del trigger.

   Organización (una función por regla, para poder extender
   sin desmontar nada):

   sgip_integrity_violation(msg)       lanza SG403
   sgip_controlled_deletion_allowed()  ÚNICO punto de
                                       extensión para una vía
                                       de eliminación
                                       controlada (espurgo,
                                       REQ-ESP-003). Hoy
                                       siempre devuelve false.
   sgip_expediente_lock(id)            estado y código del
                                       expediente (FOR SHARE)
   sgip_guard_expedientes()            INSERT/UPDATE/DELETE
   sgip_guard_repository_documents()   INSERT/UPDATE/DELETE
   sgip_guard_audit_logs()             UPDATE/DELETE
   sgip_guard_truncate()               TRUNCATE (las tres)
========================================================= */

export const INTEGRITY_SQLSTATE = 'SG403';

const INSTALL_LOCK = "hashtext('sgip:db-integrity')";

const FUNCTIONS = String.raw`
CREATE OR REPLACE FUNCTION sgip_integrity_violation(p_message text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION USING
    ERRCODE = '${INTEGRITY_SQLSTATE}',
    MESSAGE = p_message,
    HINT = 'Regla de inmutabilidad REQ-EXP-002.2';
END;
$$;

/*
 * Punto de extensión para la eliminación controlada
 * (REQ-ESP-003, espurgo). Mientras devuelva false, ningún
 * DELETE protegido pasa. Una implementación futura debe
 * validar aquí (o desde una función de espurgo que deje una
 * marca de transacción) que la eliminación es legítima.
 */
CREATE OR REPLACE FUNCTION sgip_controlled_deletion_allowed(
  p_table text,
  p_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN false;
END;
$$;

/*
 * Estado y código del expediente, con FOR SHARE: una
 * modificación de documento y el cierre del expediente
 * (que toma FOR UPDATE) no pueden cruzarse.
 */
CREATE OR REPLACE FUNCTION sgip_expediente_lock(
  p_id uuid,
  OUT status text,
  OUT code text
)
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT e.status::text, e.code
    INTO status, code
    FROM expedientes e
   WHERE e.id = p_id
     FOR SHARE;
END;
$$;

CREATE OR REPLACE FUNCTION sgip_guard_expedientes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status::text <> 'ABIERTO'
       OR NEW.closed_at IS NOT NULL
       OR NEW.closed_by_id IS NOT NULL
       OR NEW.close_reason IS NOT NULL
       OR NEW.seal_hash IS NOT NULL
       OR NEW.sealed_at IS NOT NULL
       OR NEW.seal_version IS NOT NULL THEN
      PERFORM sgip_integrity_violation(
        'Un expediente solo puede crearse ABIERTO y sin datos de cierre ni sello.'
      );
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF sgip_controlled_deletion_allowed(TG_TABLE_NAME, OLD.id) THEN
      RETURN OLD;
    END IF;

    IF OLD.status::text = 'CERRADO' THEN
      PERFORM sgip_integrity_violation(format(
        'El expediente %s está cerrado y no se puede eliminar.',
        OLD.code
      ));
    END IF;

    IF EXISTS (
      SELECT 1 FROM repository_documents WHERE expediente_id = OLD.id
    ) THEN
      PERFORM sgip_integrity_violation(format(
        'El expediente %s tiene documentos foliados y no se puede eliminar.',
        OLD.code
      ));
    END IF;

    RETURN OLD;
  END IF;

  /* UPDATE */
  IF OLD.status::text = 'CERRADO' THEN
    PERFORM sgip_integrity_violation(format(
      'El expediente %s está cerrado y no admite modificaciones.',
      OLD.code
    ));
  END IF;

  IF NEW.id <> OLD.id OR NEW.code IS DISTINCT FROM OLD.code THEN
    PERFORM sgip_integrity_violation(format(
      'El código del expediente %s no puede modificarse.',
      OLD.code
    ));
  END IF;

  IF NEW.next_folio < OLD.next_folio THEN
    PERFORM sgip_integrity_violation(format(
      'El consecutivo de folios del expediente %s no puede retroceder.',
      OLD.code
    ));
  END IF;

  IF NEW.status::text = 'CERRADO' THEN
    /* Transición ABIERTO -> CERRADO: cierre y sello juntos */
    IF NEW.closed_at IS NULL
       OR NEW.closed_by_id IS NULL
       OR NEW.close_reason IS NULL
       OR NEW.seal_hash IS NULL
       OR NEW.sealed_at IS NULL
       OR NEW.seal_version IS NULL THEN
      PERFORM sgip_integrity_violation(format(
        'El cierre del expediente %s debe registrar en la misma operación la fecha, el usuario, el motivo y el sello.',
        OLD.code
      ));
    END IF;
  ELSIF NEW.closed_at IS DISTINCT FROM OLD.closed_at
     OR NEW.closed_by_id IS DISTINCT FROM OLD.closed_by_id
     OR NEW.close_reason IS DISTINCT FROM OLD.close_reason
     OR NEW.seal_hash IS DISTINCT FROM OLD.seal_hash
     OR NEW.sealed_at IS DISTINCT FROM OLD.sealed_at
     OR NEW.seal_version IS DISTINCT FROM OLD.seal_version THEN
    PERFORM sgip_integrity_violation(format(
      'Los datos de cierre y sello del expediente %s solo se registran al cerrarlo.',
      OLD.code
    ));
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sgip_guard_repository_documents()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_exp record;
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE')
     AND (NEW.expediente_id IS NULL) <> (NEW.folio IS NULL) THEN
    PERFORM sgip_integrity_violation(format(
      'El documento "%s" debe tener expediente y folio a la vez (o ninguno).',
      NEW.name
    ));
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.expediente_id IS NOT NULL THEN
      v_exp := sgip_expediente_lock(NEW.expediente_id);

      IF v_exp.status = 'CERRADO' THEN
        PERFORM sgip_integrity_violation(format(
          'El expediente %s está cerrado: no se le pueden agregar documentos.',
          v_exp.code
        ));
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.expediente_id IS NULL
       OR sgip_controlled_deletion_allowed(TG_TABLE_NAME, OLD.id) THEN
      RETURN OLD;
    END IF;

    v_exp := sgip_expediente_lock(OLD.expediente_id);

    IF v_exp.status = 'CERRADO' THEN
      PERFORM sgip_integrity_violation(format(
        'El documento "%s" pertenece al expediente cerrado %s y no se puede eliminar.',
        OLD.name, v_exp.code
      ));
    END IF;

    PERFORM sgip_integrity_violation(format(
      'El documento "%s" está foliado (folio %s del expediente %s) y no se puede eliminar.',
      OLD.name, OLD.folio, v_exp.code
    ));
  END IF;

  /* UPDATE */
  IF OLD.expediente_id IS NOT NULL THEN
    v_exp := sgip_expediente_lock(OLD.expediente_id);

    IF v_exp.status = 'CERRADO' THEN
      PERFORM sgip_integrity_violation(format(
        'El documento "%s" pertenece al expediente cerrado %s y no admite modificaciones.',
        OLD.name, v_exp.code
      ));
    END IF;

    IF NEW.expediente_id IS DISTINCT FROM OLD.expediente_id THEN
      PERFORM sgip_integrity_violation(format(
        'El documento "%s" ya está foliado en el expediente %s: no se puede retirar ni mover a otro expediente.',
        OLD.name, v_exp.code
      ));
    END IF;
  ELSIF NEW.expediente_id IS NOT NULL THEN
    /* Foliado: NULL -> expediente */
    v_exp := sgip_expediente_lock(NEW.expediente_id);

    IF v_exp.status = 'CERRADO' THEN
      PERFORM sgip_integrity_violation(format(
        'El expediente %s está cerrado: no se pueden foliar documentos en él.',
        v_exp.code
      ));
    END IF;
  END IF;

  IF OLD.folio IS NOT NULL AND NEW.folio IS DISTINCT FROM OLD.folio THEN
    PERFORM sgip_integrity_violation(format(
      'El folio %s del documento "%s" no puede modificarse.',
      OLD.folio, OLD.name
    ));
  END IF;

  IF OLD.hash IS NOT NULL
     AND (NEW.hash IS DISTINCT FROM OLD.hash
          OR NEW.hash_algorithm IS DISTINCT FROM OLD.hash_algorithm) THEN
    PERFORM sgip_integrity_violation(format(
      'El hash del documento "%s" ya fue registrado y no puede modificarse.',
      OLD.name
    ));
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sgip_guard_audit_logs()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM sgip_integrity_violation(
    'La bitácora de auditoría es de solo inserción: no se puede modificar ni eliminar.'
  );
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION sgip_guard_truncate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM sgip_integrity_violation(format(
    'No se permite vaciar (TRUNCATE) la tabla %s.',
    TG_TABLE_NAME
  ));
  RETURN NULL;
END;
$$;
`;

const TRIGGERS: { table: string; name: string; definition: string }[] = [
  {
    table: 'expedientes',
    name: 'sgip_expedientes_guard',
    definition:
      'BEFORE INSERT OR UPDATE OR DELETE ON expedientes FOR EACH ROW EXECUTE FUNCTION sgip_guard_expedientes()',
  },
  {
    table: 'repository_documents',
    name: 'sgip_repository_documents_guard',
    definition:
      'BEFORE INSERT OR UPDATE OR DELETE ON repository_documents FOR EACH ROW EXECUTE FUNCTION sgip_guard_repository_documents()',
  },
  {
    table: 'audit_logs',
    name: 'sgip_audit_logs_append_only',
    definition:
      'BEFORE UPDATE OR DELETE ON audit_logs FOR EACH ROW EXECUTE FUNCTION sgip_guard_audit_logs()',
  },
  ...['expedientes', 'repository_documents', 'audit_logs'].map((table) => ({
    table,
    name: `sgip_${table}_no_truncate`,
    definition: `BEFORE TRUNCATE ON ${table} FOR EACH STATEMENT EXECUTE FUNCTION sgip_guard_truncate()`,
  })),
];

@Injectable()
export class DbIntegrityService implements OnModuleInit {
  private readonly logger = new Logger(DbIntegrityService.name);

  constructor(private readonly dataSource: DataSource) {}

  /*
   * synchronize ya creó las tablas cuando corre
   * onModuleInit. Un error aquí aborta el arranque.
   */
  async onModuleInit() {
    await this.dataSource.transaction(async (manager) => {
      await manager.query(`SELECT pg_advisory_xact_lock(${INSTALL_LOCK})`);

      await manager.query(FUNCTIONS);

      for (const trigger of TRIGGERS) {
        await manager.query(
          `DROP TRIGGER IF EXISTS ${trigger.name} ON ${trigger.table}`,
        );

        await manager.query(
          `CREATE TRIGGER ${trigger.name} ${trigger.definition}`,
        );
      }
    });

    this.logger.log(
      `Triggers de inmutabilidad instalados (${TRIGGERS.length}, SQLSTATE ${INTEGRITY_SQLSTATE})`,
    );
  }
}
