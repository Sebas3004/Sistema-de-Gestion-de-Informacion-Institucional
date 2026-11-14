import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  EntityManager,
  Repository,
} from 'typeorm';

import {
  Expediente,
  ExpedienteStatus,
  Folder,
  RepositoryDocument,
  User,
} from '../entities';

import { AuditService } from '../services';

import { existsSync } from 'fs';

import { resolveUploadPath } from '../upload-path';

import {
  HASH_ALGORITHM,
  MissingFileError,
  sha256File,
} from '../file-hash';

import {
  buildManifest,
  SEAL_VERSION,
} from './expediente-seal';

import {
  CreateExpedienteDto,
  ListExpedientesQueryDto,
  UpdateExpedienteDto,
} from './expedientes.dto';

export type VerifyDocumentResult = {
  folio: number | null;
  nombre: string;
  hashEsperado: string | null;
  hashActual: string | null;
  ok: boolean;
  motivo?: string;
};

const CLOSED_MESSAGE =
  'El expediente está cerrado y no admite modificaciones';

const AUDIT_ENTITY = 'Expediente';

/*
 * Costa Rica (UTC-6, sin horario de verano), igual que
 * los filtros de fecha de AuditService.
 */
const currentYear = () =>
  new Date(Date.now() - 6 * 60 * 60 * 1000).getUTCFullYear();

/* =========================================================
   SERVICIO DE EXPEDIENTES
========================================================= */

@Injectable()
export class ExpedientesService {
  constructor(
    @InjectRepository(Expediente)
    private repo: Repository<Expediente>,

    @InjectRepository(RepositoryDocument)
    private documents: Repository<RepositoryDocument>,

    @InjectRepository(Folder)
    private folders: Repository<Folder>,

    @InjectRepository(User)
    private users: Repository<User>,

    private audit: AuditService,
  ) {}

  /* =======================================================
     CONSULTA
  ======================================================= */

  list(query: ListExpedientesQueryDto) {
    const qb = this.repo
      .createQueryBuilder('expediente')
      .leftJoinAndSelect('expediente.folder', 'folder')
      .leftJoinAndSelect('expediente.createdBy', 'createdBy')
      .leftJoinAndSelect('expediente.closedBy', 'closedBy')
      .loadRelationCountAndMap(
        'expediente.documentCount',
        'expediente.documents',
      );

    if (query.status) {
      qb.andWhere('expediente.status = :status', {
        status: query.status,
      });
    }

    if (query.folderId) {
      qb.andWhere('folder.id = :folderId', {
        folderId: query.folderId,
      });
    }

    if (query.search) {
      const pattern = `%${query.search.replace(
        /[\\%_]/g,
        (char) => `\\${char}`,
      )}%`;

      qb.andWhere(
        `(expediente.code ILIKE :q
          OR expediente.name ILIKE :q
          OR COALESCE(expediente.description, '') ILIKE :q)`,
        { q: pattern },
      );
    }

    return qb
      .orderBy('expediente.createdAt', 'DESC')
      .addOrderBy('expediente.code', 'DESC')
      .getMany();
  }

  /*
   * Detalle con los documentos ordenados por folio.
   */
  async get(id: string) {
    const expediente = await this.repo.findOne({
      where: { id },
      relations: {
        folder: true,
        createdBy: true,
        closedBy: true,
      },
    });

    if (!expediente) {
      throw new NotFoundException(
        'Expediente no encontrado',
      );
    }

    const documents = await this.documents.find({
      where: { expediente: { id } },
      relations: { folder: true },
      order: { folio: 'ASC' },
    });

    return {
      ...expediente,
      documents,
    };
  }

  /* =======================================================
     CREAR
  ======================================================= */

  async create(
    dto: CreateExpedienteDto,
    current: any,
  ) {
    const user = await this.currentUser(current);
    const folder = await this.resolveFolder(dto.folderId);

    const saved = await this.repo.manager.transaction(
      async (manager) => {
        const code = await this.nextCode(manager);

        const entity = manager.create(Expediente, {
          code,
          name: dto.name,
          description: dto.description || null,
          folder,
          status: ExpedienteStatus.ABIERTO,
          nextFolio: 1,
          createdBy: user,
        });

        const created = await manager.save(entity);

        await this.audit.log(
          current.sub,
          'CREACION',
          AUDIT_ENTITY,
          created.id,
          `Se creó el expediente ${created.code} "${created.name}"` +
            ` | Carpeta: ${folder?.name ?? 'Sin carpeta'}`,
          manager,
        );

        return created;
      },
    );

    return this.get(saved.id);
  }

  /* =======================================================
     EDITAR (solo name, description y carpeta)
  ======================================================= */

  async update(
    id: string,
    dto: UpdateExpedienteDto,
    current: any,
  ) {
    await this.repo.manager.transaction(async (manager) => {
      const locked = await this.lockOrFail(manager, id);

      this.assertOpen(locked);

      const expediente = await manager.findOne(Expediente, {
        where: { id },
        relations: { folder: true },
      });

      const changes: string[] = [];

      if (
        dto.name !== undefined &&
        dto.name !== expediente.name
      ) {
        changes.push(`nombre: ${expediente.name} → ${dto.name}`);
        expediente.name = dto.name;
      }

      if (dto.description !== undefined) {
        const next = dto.description || null;

        if ((expediente.description ?? null) !== next) {
          changes.push(
            `descripción: ${expediente.description ?? '-'} → ${next ?? '-'}`,
          );
          expediente.description = next;
        }
      }

      if (dto.folderId !== undefined) {
        const nextFolder = await this.resolveFolder(
          dto.folderId,
          manager,
        );

        if (
          (expediente.folder?.id ?? null) !==
          (nextFolder?.id ?? null)
        ) {
          changes.push(
            `carpeta: ${expediente.folder?.name ?? '-'} → ${nextFolder?.name ?? '-'}`,
          );
          expediente.folder = nextFolder;
        }
      }

      if (!changes.length) {
        return;
      }

      await manager.save(expediente);

      await this.audit.log(
        current.sub,
        'ACTUALIZACION',
        AUDIT_ENTITY,
        id,
        `Se actualizó el expediente ${expediente.code}` +
          ` | Cambios: ${changes.join('; ')}`,
        manager,
      );
    });

    return this.get(id);
  }

  /* =======================================================
     FOLIADO

     Bloqueo pesimista sobre el expediente: si dos usuarios
     agregan documentos a la vez, el segundo espera a que el
     primero confirme y lee el nextFolio ya incrementado.
     Folios consecutivos, sin huecos ni reutilización (no
     existe la operación de quitar documentos).
  ======================================================= */

  async addDocument(
    id: string,
    documentId: string,
    current: any,
  ) {
    /*
     * Integridad (REQ-EXP-002.3): solo se folian documentos
     * con archivo en disco. El hash de documentos viejos se
     * calcula aquí, ANTES de la transacción, para no tener
     * bloqueado el expediente mientras se lee el archivo.
     */
    const candidate = await this.documents.findOne({
      where: { id: documentId },
      loadEagerRelations: false,
    });

    if (!candidate) {
      throw new NotFoundException(
        'Documento no encontrado',
      );
    }

    const fileHash = await this.ensureFileHash(candidate, {
      noFile: `No se puede foliar: el documento "${candidate.name}" no tiene un archivo asociado.`,
      missing: `No se puede foliar: el archivo del documento "${candidate.name}" no existe en el servidor.`,
    });

    await this.repo.manager.transaction(async (manager) => {
      const expediente = await this.lockOrFail(manager, id);

      this.assertOpen(expediente);

      /*
       * También se bloquea el documento: evita que dos
       * expedientes distintos lo foleen al mismo tiempo.
       * (SQL directo: RepositoryDocument tiene relaciones
       * eager y FOR UPDATE no admite LEFT JOIN.)
       */
      const [document] = await manager.query(
        `SELECT id, name, hash, expediente_id AS "expedienteId"
         FROM repository_documents
         WHERE id = $1
         FOR UPDATE`,
        [documentId],
      );

      if (!document) {
        throw new NotFoundException(
          'Documento no encontrado',
        );
      }

      if (document.expedienteId === id) {
        throw new BadRequestException(
          'El documento ya forma parte de este expediente',
        );
      }

      if (document.expedienteId) {
        const other = await manager.findOne(Expediente, {
          where: { id: document.expedienteId },
        });

        throw new BadRequestException(
          `El documento ya pertenece al expediente ${other?.code ?? ''}`.trim(),
        );
      }

      const folio = expediente.nextFolio;
      const hash = document.hash || fileHash;

      await manager.update(RepositoryDocument, documentId, {
        expediente: { id } as Expediente,
        folio,
        /* Solo se completa el hash si aún no tenía */
        ...(document.hash
          ? {}
          : { hash, hashAlgorithm: HASH_ALGORITHM }),
      });

      await manager.update(Expediente, id, {
        nextFolio: folio + 1,
      });

      await this.audit.log(
        current.sub,
        'FOLIADO',
        AUDIT_ENTITY,
        id,
        `Se agregó el documento "${document.name}" al expediente ${expediente.code} con el folio ${folio}` +
          ` | SHA-256: ${hash}`,
        manager,
      );
    });

    return this.get(id);
  }

  /* =======================================================
     CIERRE FORMAL (solo ADMIN)
  ======================================================= */

  async close(
    id: string,
    reason: string,
    current: any,
  ) {
    await this.repo.manager.transaction(async (manager) => {
      const expediente = await this.lockOrFail(manager, id);

      this.assertOpen(expediente);

      const documents = await manager.find(RepositoryDocument, {
        where: { expediente: { id } },
        order: { folio: 'ASC' },
        loadEagerRelations: false,
      });

      const total = documents.length;

      if (!total) {
        throw new BadRequestException(
          'No se puede cerrar un expediente sin documentos',
        );
      }

      /*
       * Antes de sellar: todos los archivos deben existir y
       * los documentos viejos sin hash lo reciben ahora. Se
       * hace con el expediente bloqueado (operación poco
       * frecuente y solo de ADMIN).
       */
      for (const document of documents) {
        const label = `folio ${document.folio} ("${document.name}")`;

        const hash = await this.ensureFileHash(document, {
          noFile: `No se puede cerrar el expediente: el ${label} no tiene un archivo asociado.`,
          missing: `No se puede cerrar el expediente: el archivo del ${label} no existe en el servidor.`,
        });

        if (!document.hash) {
          await manager.update(RepositoryDocument, document.id, {
            hash,
            hashAlgorithm: HASH_ALGORITHM,
          });
        }
      }

      const user = await manager.findOne(User, {
        where: { id: current.sub },
      });

      const closedAt = new Date();

      await manager.update(Expediente, id, {
        status: ExpedienteStatus.CERRADO,
        closedAt,
        closedBy: user,
        closeReason: reason,
        sealedAt: closedAt,
      });

      /*
       * El manifiesto se arma leyendo de la BD lo que se
       * acaba de guardar (mismo constructor que verify).
       */
      const { sealHash } = await buildManifest(manager, id);

      await manager.update(Expediente, id, {
        sealHash,
        sealVersion: SEAL_VERSION,
      });

      await this.audit.log(
        current.sub,
        'CIERRE',
        AUDIT_ENTITY,
        id,
        `Se cerró el expediente ${expediente.code} con ${total} ` +
          `${total === 1 ? 'documento' : 'documentos'} (folios 1 a ${expediente.nextFolio - 1})` +
          ` | Motivo: ${reason}` +
          ` | Sello SHA-256 (v${SEAL_VERSION}): ${sealHash}`,
        manager,
      );
    });

    return this.get(id);
  }

  /* =======================================================
     VERIFICACIÓN DE INTEGRIDAD (todos los roles)

     Recalcula el hash de cada archivo en disco y el sello
     desde la BD. No modifica nada salvo la auditoría.
  ======================================================= */

  async verify(id: string, current: any) {
    const expediente = await this.repo.findOne({
      where: { id },
    });

    if (!expediente) {
      throw new NotFoundException(
        'Expediente no encontrado',
      );
    }

    const documents = await this.documents.find({
      where: { expediente: { id } },
      order: { folio: 'ASC' },
      loadEagerRelations: false,
    });

    const documentos: VerifyDocumentResult[] = [];

    for (const document of documents) {
      documentos.push(await this.verifyDocument(document));
    }

    let sealValido: boolean | null = null;
    let motivo: string | undefined;

    if (expediente.status !== ExpedienteStatus.CERRADO) {
      motivo = 'El expediente está abierto y aún no tiene sello.';
    } else if (!expediente.sealHash) {
      motivo =
        'El expediente se cerró antes del sellado; no hay sello que verificar.';
    } else {
      const { sealHash } = await buildManifest(this.repo.manager, id);

      sealValido = sealHash === expediente.sealHash;

      if (!sealValido) {
        motivo =
          'El sello no coincide: los datos del expediente o de sus documentos cambiaron en la base de datos después del cierre.';
      }
    }

    const documentosOk = documentos.every((d) => d.ok);

    /*
     * Cerrado: exige sello válido. Abierto: solo archivos.
     * Cerrado sin sello (anterior al sellado): no íntegro.
     */
    const integro =
      expediente.status === ExpedienteStatus.CERRADO
        ? documentosOk && sealValido === true
        : documentosOk;

    const failed = documentos.filter((d) => !d.ok);

    await this.audit.log(
      current.sub,
      'VERIFICACION',
      AUDIT_ENTITY,
      id,
      `Verificación de integridad del expediente ${expediente.code}: ` +
        `${integro ? 'ÍNTEGRO' : 'NO ÍNTEGRO'}` +
        ` | Sello: ${sealValido === null ? 'sin sello' : sealValido ? 'válido' : 'NO válido'}` +
        ` | Documentos correctos: ${documentos.length - failed.length}/${documentos.length}` +
        (failed.length
          ? ` | Fallan: ${failed.map((d) => `folio ${d.folio} (${d.motivo})`).join('; ')}`
          : ''),
    );

    return {
      integro,
      sealValido,
      sealHash: expediente.sealHash,
      sealVersion: expediente.sealVersion,
      verificadoEn: new Date().toISOString(),
      ...(motivo ? { motivo } : {}),
      documentos,
    };
  }

  /* =======================================================
     MANIFIESTO (evidencia descargable)

     Devuelve exactamente el JSON canónico cuyo SHA-256 es
     el sello, para que pueda comprobarse fuera del sistema.
  ======================================================= */

  async manifest(id: string, current: any) {
    const expediente = await this.repo.findOne({
      where: { id },
    });

    if (!expediente) {
      throw new NotFoundException(
        'Expediente no encontrado',
      );
    }

    if (expediente.status !== ExpedienteStatus.CERRADO) {
      throw new BadRequestException(
        'El expediente aún no está sellado',
      );
    }

    if (!expediente.sealHash) {
      throw new BadRequestException(
        'El expediente se cerró antes del sellado y no tiene manifiesto',
      );
    }

    const { json } = await buildManifest(this.repo.manager, id);

    await this.audit.log(
      current.sub,
      'DESCARGA',
      AUDIT_ENTITY,
      id,
      `Se descargó el manifiesto del expediente ${expediente.code}`,
    );

    return {
      fileName: `${expediente.code}-manifiesto.json`,
      json,
    };
  }

  /* =======================================================
     HELPERS
  ======================================================= */

  /*
   * SELECT ... FOR UPDATE sobre el expediente. Sin
   * relaciones (no son eager), así que no hay JOINs.
   */
  private async lockOrFail(
    manager: EntityManager,
    id: string,
  ) {
    const expediente = await manager.findOne(Expediente, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });

    if (!expediente) {
      throw new NotFoundException(
        'Expediente no encontrado',
      );
    }

    return expediente;
  }

  /*
   * Devuelve el hash del archivo del documento: el guardado
   * si ya tiene uno (comprobando que el archivo siga en
   * disco) o uno recién calculado. Lanza 400 con el mensaje
   * indicado si no hay archivo o si no existe en disco.
   */
  private async ensureFileHash(
    document: RepositoryDocument,
    messages: { noFile: string; missing: string },
  ): Promise<string> {
    if (!document.storedName) {
      throw new BadRequestException(messages.noFile);
    }

    if (document.hash) {
      if (!existsSync(resolveUploadPath(document.storedName))) {
        throw new BadRequestException(messages.missing);
      }

      return document.hash;
    }

    try {
      return await sha256File(document.storedName);
    } catch (error) {
      if (error instanceof MissingFileError) {
        throw new BadRequestException(messages.missing);
      }

      throw error;
    }
  }

  private async verifyDocument(
    document: RepositoryDocument,
  ): Promise<VerifyDocumentResult> {
    const result: VerifyDocumentResult = {
      folio: document.folio,
      nombre: document.name,
      hashEsperado: document.hash ?? null,
      hashActual: null,
      ok: false,
    };

    if (!document.storedName) {
      return { ...result, motivo: 'El documento no tiene un archivo asociado' };
    }

    try {
      result.hashActual = await sha256File(document.storedName);
    } catch (error) {
      return {
        ...result,
        motivo:
          error instanceof MissingFileError
            ? 'Archivo no encontrado en el servidor'
            : 'No se pudo leer el archivo',
      };
    }

    if (!document.hash) {
      return { ...result, motivo: 'Sin hash registrado' };
    }

    if (result.hashActual !== document.hash) {
      return {
        ...result,
        motivo: 'El hash no coincide: el archivo fue modificado',
      };
    }

    return { ...result, ok: true };
  }

  private assertOpen(expediente: Expediente) {
    if (expediente.status === ExpedienteStatus.CERRADO) {
      throw new ForbiddenException(CLOSED_MESSAGE);
    }
  }

  /*
   * EXP-AAAA-NNNNN, consecutivo por año. El advisory lock
   * (liberado al terminar la transacción) serializa las
   * creaciones del mismo año; el UNIQUE de code es respaldo.
   */
  private async nextCode(manager: EntityManager) {
    const year = currentYear();
    const prefix = `EXP-${year}-`;

    await manager.query(
      'SELECT pg_advisory_xact_lock(hashtext($1))',
      [`expedientes:code:${year}`],
    );

    const [row] = await manager.query(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM $2::int) AS int)), 0) AS last
       FROM expedientes
       WHERE code ~ $1`,
      [`^${prefix}[0-9]+$`, prefix.length + 1],
    );

    const next = Number(row?.last ?? 0) + 1;

    return `${prefix}${String(next).padStart(5, '0')}`;
  }

  private async resolveFolder(
    folderId: string | null | undefined,
    manager?: EntityManager,
  ): Promise<Folder | null> {
    if (!folderId) {
      return null;
    }

    const folders = manager
      ? manager.getRepository(Folder)
      : this.folders;

    const folder = await folders.findOne({
      where: { id: folderId },
    });

    if (!folder) {
      throw new NotFoundException(
        'Carpeta no encontrada',
      );
    }

    return folder;
  }

  private async currentUser(current: any) {
    return this.users.findOne({
      where: {
        id: current.sub,
      },
    });
  }
}
