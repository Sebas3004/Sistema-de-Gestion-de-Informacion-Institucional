import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  In,
  Repository,
} from 'typeorm';

import {
  EspurgoRequest,
  EspurgoStatus,
  RepositoryDocument,
  User,
} from '../entities';

import {
  AuditService,
} from '../services';

import {
  CisetReviewDto,
  CreateEspurgoRequestDto,
  DirectorDecisionDto,
} from './espurgo.dto';

const AUDIT_ENTITY =
  'Espurgo';

/* =========================================================
   SERVICIO DE ESPURGO - REQ-ESP-003
========================================================= */

@Injectable()
export class EspurgoService {
  constructor(
    @InjectRepository(
      EspurgoRequest,
    )
    private readonly repo:
      Repository<EspurgoRequest>,

    @InjectRepository(
      RepositoryDocument,
    )
    private readonly documents:
      Repository<RepositoryDocument>,

    @InjectRepository(
      User,
    )
    private readonly users:
      Repository<User>,

    private readonly audit:
      AuditService,
  ) {}

  /* =======================================================
     CONSULTA
  ======================================================= */

  list() {
    return this.repo.find({
      order: {
        createdAt:
          'DESC',
      },
    });
  }

  async get(
    id: string,
  ) {
    const request =
      await this.repo.findOne({
        where: {
          id,
        },
      });

    if (!request) {
      throw new NotFoundException(
        'Solicitud de espurgo no encontrada',
      );
    }

    return request;
  }

  /* =======================================================
     CREAR SOLICITUD
  ======================================================= */

  async create(
    dto:
      CreateEspurgoRequestDto,
    current: any,
  ) {
    const currentUser =
      await this.users.findOne({
        where: {
          id:
            current.sub,
        },
      });

    if (!currentUser) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    /*
     * Elimina IDs repetidos para evitar relaciones
     * duplicadas accidentalmente.
     */
    const documentIds =
      Array.from(
        new Set(
          dto.documentIds,
        ),
      );

    const documents =
      await this.documents.find({
        where: {
          id:
            In(documentIds),
        },

        relations: {
          expediente:
            true,
          folder:
            true,
        },
      });

    if (
      documents.length !==
      documentIds.length
    ) {
      throw new BadRequestException(
        'Uno o más documentos seleccionados no existen',
      );
    }

    /*
     * Evita que un mismo documento tenga dos procesos
     * activos de espurgo simultáneamente.
     *
     * Una solicitud RECHAZADA o ya respaldada mediante
     * ACTA_REGISTRADA se considera terminada.
     */
    const existing =
      await this.repo
        .createQueryBuilder(
          'espurgo',
        )
        .innerJoin(
          'espurgo.documents',
          'document',
        )
        .where(
          'document.id IN (:...documentIds)',
          {
            documentIds,
          },
        )
        .andWhere(
          'espurgo.status NOT IN (:...terminalStatuses)',
          {
            terminalStatuses: [
              EspurgoStatus.RECHAZADA,
              EspurgoStatus.ACTA_REGISTRADA,
            ],
          },
        )
        .getOne();

    if (existing) {
      throw new BadRequestException(
        'Uno o más documentos ya forman parte de una solicitud de espurgo activa',
      );
    }

    const entity =
      this.repo.create({
        unitName:
          dto.unitName.trim(),

        justification:
          dto.justification.trim(),

        status:
          EspurgoStatus.SOLICITADA,

        requestedBy:
          currentUser,

        documents,
      });

    const saved =
      await this.repo.save(
        entity,
      );

    await this.audit.log(
      current.sub,
      'SOLICITUD_ESPURGO',
      AUDIT_ENTITY,
      saved.id,
      `Se creó una solicitud de espurgo para ${documents.length} documento(s)` +
        ` | Unidad: ${saved.unitName}` +
        ` | Justificación: ${saved.justification}`,
    );

    return this.get(
      saved.id,
    );
  }

  /* =======================================================
     REVISIÓN CISET
  ======================================================= */

  async reviewByCiset(
    id: string,
    dto:
      CisetReviewDto,
    current: any,
  ) {
    const request =
      await this.get(id);

    if (
      request.status !==
      EspurgoStatus.SOLICITADA
    ) {
      throw new BadRequestException(
        'La solicitud ya fue revisada por el CISET o no se encuentra en estado SOLICITADA',
      );
    }

    const user =
      await this.users.findOne({
        where: {
          id:
            current.sub,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    if (
      !dto.approved &&
      !dto.notes?.trim()
    ) {
      throw new BadRequestException(
        'Debe indicar el motivo del rechazo del CISET',
      );
    }

    request.cisetReviewedBy =
      user;

    request.cisetReviewedAt =
      new Date();

    request.cisetNotes =
      dto.notes?.trim() ||
      null;

    request.status =
      dto.approved
        ? EspurgoStatus.PENDIENTE_DIRECCION
        : EspurgoStatus.RECHAZADA;

    const saved =
      await this.repo.save(
        request,
      );

    await this.audit.log(
      current.sub,
      dto.approved
        ? 'APROBACION_CISET'
        : 'RECHAZO_CISET',
      AUDIT_ENTITY,
      saved.id,
      dto.approved
        ? 'El CISET aprobó continuar con el proceso de espurgo y se remitió a Dirección'
        : `El CISET rechazó el proceso de espurgo | Motivo: ${request.cisetNotes}`,
    );

    return saved;
  }

  /* =======================================================
     DECISIÓN DE DIRECCIÓN
  ======================================================= */

  async directorDecision(
    id: string,
    dto:
      DirectorDecisionDto,
    current: any,
  ) {
    const request =
      await this.get(id);

    if (
      request.status !==
      EspurgoStatus.PENDIENTE_DIRECCION
    ) {
      throw new BadRequestException(
        'La solicitud no se encuentra pendiente de aprobación de Dirección',
      );
    }

    const user =
      await this.users.findOne({
        where: {
          id:
            current.sub,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    if (
      !dto.approved &&
      !dto.notes?.trim()
    ) {
      throw new BadRequestException(
        'Debe indicar el motivo del rechazo de Dirección',
      );
    }

    request.directorName =
      dto.directorName.trim();

    request.directorDecisionBy =
      user;

    request.directorDecisionAt =
      new Date();

    request.directorNotes =
      dto.notes?.trim() ||
      null;

    request.status =
      dto.approved
        ? EspurgoStatus.APROBADA
        : EspurgoStatus.RECHAZADA;

    const saved =
      await this.repo.save(
        request,
      );

    await this.audit.log(
      current.sub,
      dto.approved
        ? 'APROBACION_DIRECCION'
        : 'RECHAZO_DIRECCION',
      AUDIT_ENTITY,
      saved.id,
      dto.approved
        ? `Dirección aprobó el proceso de espurgo | Director(a): ${request.directorName}`
        : `Dirección rechazó el proceso de espurgo | Director(a): ${request.directorName}` +
            ` | Motivo: ${request.directorNotes}`,
    );

    return saved;
  }

  /* =======================================================
     REGISTRAR ACTA FIRMADA

     NO elimina documentos.
  ======================================================= */

  async uploadAct(
    id: string,
    file: any,
    current: any,
  ) {
    const request =
      await this.get(id);

    if (
      request.status !==
      EspurgoStatus.APROBADA
    ) {
      throw new BadRequestException(
        'El acta solo puede registrarse después de la aprobación de Dirección',
      );
    }

    if (
      request.actStoredName
    ) {
      throw new BadRequestException(
        'La solicitud ya tiene un acta registrada',
      );
    }

    if (!file) {
      throw new BadRequestException(
        'Debe seleccionar el acta firmada',
      );
    }

    const user =
      await this.users.findOne({
        where: {
          id:
            current.sub,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    request.actOriginalName =
      file.originalname;

    request.actStoredName =
      file.filename;

    request.actMimeType =
      file.mimetype;

    request.actSize =
      file.size;

    request.actUploadedBy =
      user;

    request.actUploadedAt =
      new Date();

    request.status =
      EspurgoStatus.ACTA_REGISTRADA;

    const saved =
      await this.repo.save(
        request,
      );

    await this.audit.log(
      current.sub,
      'REGISTRO_ACTA_ESPURGO',
      AUDIT_ENTITY,
      saved.id,
      `Se registró el acta firmada "${file.originalname}"` +
        ` | Documentos asociados: ${saved.documents.length}`,
    );

    return saved;
  }

  /* =======================================================
     PREPARAR DESCARGA DE ACTA
  ======================================================= */

  async prepareActDownload(
    id: string,
    current: any,
  ) {
    const request =
      await this.get(id);

    if (
      !request.actStoredName ||
      !request.actOriginalName
    ) {
      throw new NotFoundException(
        'La solicitud no tiene un acta registrada',
      );
    }

    await this.audit.log(
      current.sub,
      'DESCARGA_ACTA_ESPURGO',
      AUDIT_ENTITY,
      request.id,
      `Se descargó el acta "${request.actOriginalName}"`,
    );

    return request;
  }
}