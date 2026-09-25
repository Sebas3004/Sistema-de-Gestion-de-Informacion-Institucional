import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  Repository,
} from 'typeorm';

import {
  AuditLog,
  Correspondence,
  CorrespondenceAttachment,
  CorrespondenceComment,
  CorrespondenceStatus,
  ExternalLink,
  InstitutionalForm,
  News,
  Procedure,
  RepositoryDocument,
  Role,
  RoleName,
  User,
} from './entities';

import { hash } from 'bcrypt';


/* =========================================================
   AUDITORÍA
========================================================= */

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private repo: Repository<AuditLog>,

    @InjectRepository(User)
    private users: Repository<User>,
  ) {}

  async log(
    userId: string | undefined,
    action: string,
    entity: string,
    entityId?: string,
    detail?: string,
  ) {
    const user = userId
      ? await this.users.findOne({
          where: { id: userId },
        })
      : null;

    const audit = this.repo.create({
      user,
      action,
      entity,
      entityId,
      detail,
    });

    return this.repo.save(audit);
  }

  async list(
    current: any,
    all = false,
  ) {
    const where =
      all &&
      current.roles.includes(RoleName.ADMIN)
        ? {}
        : ({
            user: {
              id: current.sub,
            },
          } as any);

    return this.repo.find({
      where,
      order: {
        createdAt: 'DESC',
      },
      take: 200,
    });
  }
}


/* =========================================================
   USUARIOS
========================================================= */

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    public repo: Repository<User>,

    @InjectRepository(Role)
    private roles: Repository<Role>,

    private audit: AuditService,
  ) {}

  list() {
    return this.repo.find({
      order: {
        name: 'ASC',
      },
    });
  }

  async create(
    dto: any,
    current: any,
  ) {
    const roleNames =
      dto.roleNames?.length
        ? dto.roleNames
        : [RoleName.CONSULTOR];

    const roleRows =
      await this.roles.findBy(
        roleNames.map(
          (name: RoleName) => ({
            name,
          }),
        ) as any,
      );

    const entity =
      this.repo.create({
        name: dto.name,
        email: dto.email,
        position: dto.position,
        active: dto.active ?? true,
        passwordHash: await hash(
          dto.password || 'Temporal123!',
          10,
        ),
        roles: roleRows,
      });

    const saved =
      await this.repo.save(entity);

    await this.audit.log(
      current.sub,
      'CREACION',
      'Usuario',
      saved.id,
      `Se creó el usuario ${saved.email}`,
    );

    return saved;
  }

  async update(
    id: string,
    dto: any,
    current: any,
  ) {
    const user =
      await this.repo.findOne({
        where: { id },
      });

    if (!user) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    if (dto.roleNames) {
      user.roles =
        await this.roles.findBy(
          dto.roleNames.map(
            (name: RoleName) => ({
              name,
            }),
          ) as any,
        );
    }

    user.name =
      dto.name ?? user.name;

    user.email =
      dto.email ?? user.email;

    user.position =
      dto.position ?? user.position;

    user.active =
      dto.active ?? user.active;

    if (dto.password) {
      user.passwordHash =
        await hash(
          dto.password,
          10,
        );
    }

    const saved =
      await this.repo.save(user);

    await this.audit.log(
      current.sub,
      'ACTUALIZACION',
      'Usuario',
      id,
      `Se actualizó ${saved.email}`,
    );

    return saved;
  }
}


/* =========================================================
   CORRESPONDENCIA
========================================================= */

@Injectable()
export class CorrespondenceService {
  constructor(
    @InjectRepository(Correspondence)
    private repo: Repository<Correspondence>,

    @InjectRepository(User)
    private users: Repository<User>,

    @InjectRepository(
      CorrespondenceComment,
    )
    private comments:
      Repository<CorrespondenceComment>,

    @InjectRepository(
      CorrespondenceAttachment,
    )
    private attachments:
      Repository<CorrespondenceAttachment>,

    private audit: AuditService,
  ) {}

  list() {
    return this.repo.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  get(id: string) {
    return this.repo.findOne({
      where: { id },
    });
  }

  async create(
    dto: any,
    current: any,
  ) {
    const sender =
      await this.users.findOne({
        where: {
          id:
            dto.senderId ||
            current.sub,
        },
      });

    if (!sender) {
      throw new NotFoundException(
        'Remitente no encontrado',
      );
    }

    const responsible =
      await this.users.findOne({
        where: {
          id: dto.responsibleId,
        },
      });

    if (!responsible) {
      throw new NotFoundException(
        'Responsable no encontrado',
      );
    }

    const participants =
      dto.participantIds?.length
        ? await this.users.findBy(
            dto.participantIds.map(
              (id: string) => ({
                id,
              }),
            ) as any,
          )
        : [];

    const code =
      `COR-${new Date().getFullYear()}-${String(
        Date.now(),
      ).slice(-5)}`;

    const entity =
      this.repo.create({
        code,
        subject: dto.subject,
        description:
          dto.description,
        type:
          dto.type ||
          'Solicitud',
        priority:
          dto.priority ||
          'MEDIA',
        status:
          dto.status ||
          CorrespondenceStatus.PENDIENTE,
        sender,
        responsible,
        participants,
        dueDate:
          dto.dueDate
            ? new Date(
                dto.dueDate,
              )
            : null,
      });

    const saved =
      await this.repo.save(entity);

    await this.audit.log(
      current.sub,
      'CREACION',
      'Correspondencia',
      saved.id,
      `Se creó ${saved.code}`,
    );

    return saved;
  }

  async update(
    id: string,
    dto: any,
    current: any,
  ) {
    const item =
      await this.repo.findOne({
        where: { id },
      });

    if (!item) {
      throw new NotFoundException(
        'Correspondencia no encontrada',
      );
    }

    Object.assign(
      item,
      dto,
    );

    const saved =
      await this.repo.save(item);

    await this.audit.log(
      current.sub,
      'ACTUALIZACION',
      'Correspondencia',
      id,
      `Se actualizó ${saved.code}`,
    );

    return saved;
  }

  async addComment(
    id: string,
    body: string,
    current: any,
  ) {
    const correspondence =
      await this.repo.findOne({
        where: { id },
      });

    if (!correspondence) {
      throw new NotFoundException(
        'Correspondencia no encontrada',
      );
    }

    const user =
      await this.users.findOne({
        where: {
          id: current.sub,
        },
      });

    if (!user) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    const entity =
      this.comments.create({
        body,
        author: user,
        correspondence,
      });

    const saved =
      await this.comments.save(
        entity,
      );

    await this.audit.log(
      current.sub,
      'COMENTARIO',
      'Correspondencia',
      id,
      body,
    );

    return saved;
  }

  async addAttachment(
    id: string,
    file: any,
    current: any,
  ) {
    const correspondence =
      await this.repo.findOne({
        where: { id },
      });

    if (!correspondence) {
      throw new NotFoundException(
        'Correspondencia no encontrada',
      );
    }

    const entity =
      this.attachments.create({
        originalName:
          file.originalname,
        storedName:
          file.filename,
        mimeType:
          file.mimetype,
        size:
          file.size,
        correspondence,
      });

    const saved =
      await this.attachments.save(
        entity,
      );

    await this.audit.log(
      current.sub,
      'ADJUNTO',
      'Correspondencia',
      id,
      `Se adjuntó ${file.originalname}`,
    );

    return saved;
  }
}


/* =========================================================
   REPOSITORIO DOCUMENTAL
========================================================= */

@Injectable()
export class RepositoryService {
  constructor(
    @InjectRepository(
      RepositoryDocument,
    )
    private repo:
      Repository<RepositoryDocument>,

    @InjectRepository(User)
    private users:
      Repository<User>,

    private audit:
      AuditService,
  ) {}

  list() {
    return this.repo.find({
      order: {
        updatedAt:
          'DESC',
      },
    });
  }

  async get(id: string) {
    const document =
      await this.repo.findOne({
        where: { id },
      });

    if (!document) {
      throw new NotFoundException(
        'Documento no encontrado',
      );
    }

    return document;
  }

  async create(
    dto: any,
    current: any,
  ) {
    const responsible =
      dto.responsibleId
        ? await this.users.findOne({
            where: {
              id:
                dto.responsibleId,
            },
          })
        : null;

    const entity:
      RepositoryDocument =
      this.repo.create({
        ...dto,
        responsible,
      } as Partial<RepositoryDocument>);

    const saved:
      RepositoryDocument =
      await this.repo.save(
        entity,
      );

    await this.audit.log(
      current.sub,
      'CREACION',
      'Repositorio',
      saved.id,
      `Se creó ${saved.name}`,
    );

    return saved;
  }

  async update(
    id: string,
    dto: any,
    current: any,
  ) {
    const item =
      await this.repo.findOne({
        where: { id },
      });

    if (!item) {
      throw new NotFoundException(
        'Documento no encontrado',
      );
    }

    Object.assign(
      item,
      dto,
    );

    const saved:
      RepositoryDocument =
      await this.repo.save(
        item,
      );

    await this.audit.log(
      current.sub,
      'ACTUALIZACION',
      'Repositorio',
      id,
      `Se actualizó ${saved.name}`,
    );

    return saved;
  }
}


/* =========================================================
   PROCEDIMIENTOS
========================================================= */

@Injectable()
export class ProcedureService {
  constructor(
    @InjectRepository(
      Procedure,
    )
    private repo:
      Repository<Procedure>,

    private audit:
      AuditService,
  ) {}

  list() {
    return this.repo.find({
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  async get(id: string) {
    const item =
      await this.repo.findOne({
        where: { id },
      });

    if (!item) {
      throw new NotFoundException(
        'Procedimiento no encontrado',
      );
    }

    return item;
  }

  async create(
    dto: any,
    current: any,
  ) {
    const entity =
      this.repo.create({
        ...dto,
        status:
          dto.status || 'ACTIVO',
        validFrom:
          dto.validFrom
            ? new Date(dto.validFrom)
            : null,
        validUntil:
          dto.validUntil
            ? new Date(dto.validUntil)
            : null,
        requirements:
          Array.isArray(dto.requirements)
            ? dto.requirements
            : [],
        steps:
          Array.isArray(dto.steps)
            ? dto.steps.map(
                (
                  step: any,
                  index: number,
                ) => ({
                  stepOrder:
                    step.stepOrder ??
                    index + 1,
                  title: step.title,
                  description:
                    step.description,
                }),
              )
            : [],
        links:
          Array.isArray(dto.links)
            ? dto.links
            : [],
        relatedForms:
          Array.isArray(dto.relatedForms)
            ? dto.relatedForms
            : [],
        relatedDocuments:
          Array.isArray(dto.relatedDocuments)
            ? dto.relatedDocuments
            : [],
      } as Partial<Procedure>);

    const saved =
      await this.repo.save(entity);

    await this.audit.log(
      current.sub,
      'CREACION',
      'Procedimiento',
      saved.id,
      `Se creó ${saved.code} - ${saved.name}`,
    );

    return saved;
  }

  async update(
    id: string,
    dto: any,
    current: any,
  ) {
    const item =
      await this.repo.findOne({
        where: { id },
      });

    if (!item) {
      throw new NotFoundException(
        'Procedimiento no encontrado',
      );
    }

    item.code =
      dto.code ?? item.code;

    item.name =
      dto.name ?? item.name;

    item.description =
      dto.description ??
      item.description;

    item.category =
      dto.category ??
      item.category;

    item.status =
      dto.status ??
      item.status;

    item.responsibleArea =
      dto.responsibleArea ??
      item.responsibleArea;

    item.normative =
      dto.normative ??
      item.normative;

    if ('validFrom' in dto) {
      item.validFrom =
        dto.validFrom
          ? new Date(dto.validFrom)
          : null;
    }

    if ('validUntil' in dto) {
      item.validUntil =
        dto.validUntil
          ? new Date(dto.validUntil)
          : null;
    }

    if (Array.isArray(dto.requirements)) {
      item.requirements =
        dto.requirements;
    }

    if (Array.isArray(dto.steps)) {
      item.steps =
        dto.steps.map(
          (
            step: any,
            index: number,
          ) => ({
            id: step.id,
            stepOrder:
              step.stepOrder ??
              index + 1,
            title: step.title,
            description:
              step.description,
          }),
        ) as any;
    }

    if (Array.isArray(dto.links)) {
      item.links = dto.links;
    }

    if (Array.isArray(dto.relatedForms)) {
      item.relatedForms =
        dto.relatedForms;
    }

    if (Array.isArray(dto.relatedDocuments)) {
      item.relatedDocuments =
        dto.relatedDocuments;
    }

    const saved =
      await this.repo.save(item);

    await this.audit.log(
      current.sub,
      'ACTUALIZACION',
      'Procedimiento',
      saved.id,
      `Se actualizó ${saved.code} - ${saved.name}`,
    );

    return saved;
  }
}


/* =========================================================
   FORMULARIOS
========================================================= */

@Injectable()
export class FormsService {
  constructor(
    @InjectRepository(
      InstitutionalForm,
    )
    private repo:
      Repository<InstitutionalForm>,

    @InjectRepository(User)
    private users:
      Repository<User>,

    private audit:
      AuditService,
  ) {}

  list() {
    return this.repo.find({
      order: {
        updatedAt:
          'DESC',
      },
    });
  }

  async create(
    dto: any,
    current: any,
  ) {
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

    const entity:
      InstitutionalForm =
      this.repo.create({
        ...dto,
        createdBy: user,
        updatedBy: user,
      } as Partial<InstitutionalForm>);

    const saved:
      InstitutionalForm =
      await this.repo.save(
        entity,
      );

    await this.audit.log(
      current.sub,
      'CREACION',
      'Formulario',
      saved.id,
      `Se creó ${saved.name}`,
    );

    return saved;
  }

  async download(
    id: string,
    current: any,
  ) {
    const form =
      await this.repo.findOne({
        where: { id },
      });

    if (!form) {
      throw new NotFoundException(
        'Formulario no encontrado',
      );
    }

    form.downloads =
      (form.downloads ?? 0) + 1;

    const saved =
      await this.repo.save(
        form,
      );

    await this.audit.log(
      current.sub,
      'DESCARGA',
      'Formulario',
      id,
      `Se descargó ${saved.name}`,
    );

    return saved;
  }
}


/* =========================================================
   ENLACES
========================================================= */

@Injectable()
export class LinksService {
  constructor(
    @InjectRepository(
      ExternalLink,
    )
    private repo:
      Repository<ExternalLink>,
  ) {}

  list() {
    return this.repo.find({
      where: {
        active: true,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  create(dto: any) {
    const entity =
      this.repo.create(
        dto as Partial<ExternalLink>,
      );

    return this.repo.save(
      entity,
    );
  }
}


/* =========================================================
   NOTICIAS
========================================================= */

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(
      News,
    )
    private repo:
      Repository<News>,

    @InjectRepository(User)
    private users:
      Repository<User>,

    private audit:
      AuditService,
  ) {}

  list() {
    return this.repo.find({
      where: {
        published: true,
      },
      order: {
        createdAt:
          'DESC',
      },
    });
  }

  async create(
    dto: any,
    current: any,
  ) {
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

    const entity:
      News =
      this.repo.create({
        ...dto,
        author: user,
      } as Partial<News>);

    const saved:
      News =
      await this.repo.save(
        entity,
      );

    await this.audit.log(
      current.sub,
      'PUBLICACION',
      'Noticia',
      saved.id,
      `Se publicó ${saved.title}`,
    );

    return saved;
  }
}