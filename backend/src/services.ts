import {
  BadRequestException,
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

import { compare, hash } from 'bcrypt';
import { randomInt } from 'crypto';


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

  private generateTemporaryPassword() {
    return `Tec-SJ-${randomInt(
      100000,
      1000000,
    )}!`;
  }

  private normalizeEmail(
    value: string,
  ) {
    return String(value || '')
      .trim()
      .toLowerCase();
  }

  private async ensureEmailAvailable(
    email: string,
    excludeId?: string,
  ) {
    const existing =
      await this.repo
        .createQueryBuilder('user')
        .where(
          'LOWER(user.email) = :email',
          {
            email:
              this.normalizeEmail(
                email,
              ),
          },
        )
        .getOne();

    if (
      existing &&
      existing.id !== excludeId
    ) {
      throw new BadRequestException(
        'Ya existe un usuario con ese correo',
      );
    }
  }

  private async resolveRoles(
    roleNames?: RoleName[],
  ) {
    const requestedRoles =
      Array.from(
        new Set(
          roleNames?.length
            ? roleNames
            : [
                RoleName.CONSULTOR,
              ],
        ),
      );

    const allowedRoles =
      Object.values(RoleName);

    if (
      requestedRoles.some(
        (role) =>
          !allowedRoles.includes(
            role,
          ),
      )
    ) {
      throw new BadRequestException(
        'Rol no válido',
      );
    }

    const roleRows =
      await this.roles.findBy(
        requestedRoles.map(
          (name: RoleName) => ({
            name,
          }),
        ) as any,
      );

    if (
      roleRows.length !==
      requestedRoles.length
    ) {
      throw new BadRequestException(
        'Uno o más roles no existen',
      );
    }

    return roleRows;
  }

  private getSafeUser(
    user: User,
  ) {
    const {
      passwordHash:
        _passwordHash,
      ...safeUser
    } = user as any;

    return safeUser;
  }

  list() {
    return this.repo.find({
      order: {
        deletedAt: 'ASC',
        name: 'ASC',
      },
    });
  }

  async create(
    dto: any,
    current: any,
  ) {
    const name =
      String(dto.name || '')
        .trim();

    const email =
      this.normalizeEmail(
        dto.email,
      );

    if (!name || !email) {
      throw new BadRequestException(
        'Nombre y correo son obligatorios',
      );
    }

    await this.ensureEmailAvailable(
      email,
    );

    const roleRows =
      await this.resolveRoles(
        dto.roleNames,
      );

    const temporaryPassword =
      String(
        dto.password || '',
      ).trim() ||
      this.generateTemporaryPassword();

    if (
      temporaryPassword.length <
      8
    ) {
      throw new BadRequestException(
        'La contraseña temporal debe tener al menos 8 caracteres',
      );
    }

    const entity =
      this.repo.create({
        name,
        email,
        position:
          String(
            dto.position || '',
          ).trim() || null,
        active:
          dto.active ?? true,
        mustChangePassword:
          true,
        passwordHash:
          await hash(
            temporaryPassword,
            10,
          ),
        roles: roleRows,
      });

    const saved =
      await this.repo.save(
        entity,
      );

    await this.audit.log(
      current.sub,
      'CREACION',
      'Usuario',
      saved.id,
      `Se creó el usuario ${saved.email} con contraseña temporal`,
    );

    return {
      user:
        this.getSafeUser(
          saved,
        ),
      temporaryPassword,
    };
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

    if (user.deletedAt) {
      throw new BadRequestException(
        'No puede editar un usuario eliminado',
      );
    }

    const previousRoles =
      user.roles
        ?.map((role) => role.name)
        .sort() || [];

    const previousProfile = {
      name: user.name,
      email: user.email,
      position: user.position,
      active: user.active,
    };

    if (dto.roleNames) {
      if (id === current.sub) {
        throw new BadRequestException(
          'No puede modificar su propio rol administrativo',
        );
      }

      user.roles =
        await this.resolveRoles(
          dto.roleNames,
        );
    }

    if (
      dto.email !== undefined
    ) {
      const newEmail =
        this.normalizeEmail(
          dto.email,
        );

      if (!newEmail) {
        throw new BadRequestException(
          'El correo es obligatorio',
        );
      }

      await this.ensureEmailAvailable(
        newEmail,
        id,
      );

      user.email =
        newEmail;
    }

    if (
      dto.name !== undefined
    ) {
      const newName =
        String(dto.name)
          .trim();

      if (!newName) {
        throw new BadRequestException(
          'El nombre es obligatorio',
        );
      }

      user.name =
        newName;
    }

    if (
      dto.position !==
      undefined
    ) {
      user.position =
        String(
          dto.position || '',
        ).trim() || null;
    }

    user.active =
      dto.active ??
      user.active;

    const saved =
      await this.repo.save(user);

    const newRoles =
      saved.roles
        ?.map((role) => role.name)
        .sort() || [];

    const roleChanged =
      previousRoles.join(',') !==
      newRoles.join(',');

    const profileChanged =
      previousProfile.name !==
        saved.name ||
      previousProfile.email !==
        saved.email ||
      previousProfile.position !==
        saved.position ||
      previousProfile.active !==
        saved.active;

    await this.audit.log(
      current.sub,
      roleChanged
        ? 'CAMBIO_ROL'
        : profileChanged
        ? 'ACTUALIZACION_PERFIL'
        : 'ACTUALIZACION',
      'Usuario',
      id,
      roleChanged
        ? `Se cambió el rol de ${saved.email}: ${previousRoles.join(', ') || 'Sin rol'} → ${newRoles.join(', ')}`
        : profileChanged
        ? `Se actualizó el perfil de ${saved.email}`
        : `Se actualizó ${saved.email}`,
    );

    return this.getSafeUser(
      saved,
    );
  }

  async resetPassword(
    id: string,
    current: any,
    requestedPassword?: string,
  ) {
    if (id === current.sub) {
      throw new BadRequestException(
        'Para cambiar su propia contraseña utilice la opción de cambio de contraseña',
      );
    }

    const user =
      await this.repo
        .createQueryBuilder('user')
        .addSelect(
          'user.passwordHash',
        )
        .leftJoinAndSelect(
          'user.roles',
          'roles',
        )
        .where(
          'user.id = :id',
          { id },
        )
        .getOne();

    if (!user) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    if (user.deletedAt) {
      throw new BadRequestException(
        'No puede restablecer la contraseña de un usuario eliminado',
      );
    }

    const temporaryPassword =
      String(
        requestedPassword || '',
      ).trim() ||
      this.generateTemporaryPassword();

    if (
      temporaryPassword.length <
      8
    ) {
      throw new BadRequestException(
        'La contraseña temporal debe tener al menos 8 caracteres',
      );
    }

    user.passwordHash =
      await hash(
        temporaryPassword,
        10,
      );

    user.mustChangePassword =
      true;

    await this.repo.save(user);

    await this.audit.log(
      current.sub,
      'RESTABLECIMIENTO_PASSWORD',
      'Usuario',
      id,
      `Se restableció la contraseña de ${user.email}`,
    );

    return {
      userId: user.id,
      email: user.email,
      temporaryPassword,
    };
  }

  async changeOwnPassword(
    current: any,
    currentPassword: string,
    newPassword: string,
  ) {
    const user =
      await this.repo
        .createQueryBuilder('user')
        .addSelect(
          'user.passwordHash',
        )
        .leftJoinAndSelect(
          'user.roles',
          'roles',
        )
        .where(
          'user.id = :id',
          {
            id: current.sub,
          },
        )
        .getOne();

    if (
      !user ||
      !user.active ||
      user.deletedAt
    ) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    const validCurrentPassword =
      await compare(
        currentPassword,
        user.passwordHash,
      );

    if (
      !validCurrentPassword
    ) {
      throw new BadRequestException(
        'La contraseña actual no es correcta',
      );
    }

    const cleanNewPassword =
      String(
        newPassword || '',
      );

    if (
      cleanNewPassword.length <
      8
    ) {
      throw new BadRequestException(
        'La nueva contraseña debe tener al menos 8 caracteres',
      );
    }

    if (
      currentPassword ===
      cleanNewPassword
    ) {
      throw new BadRequestException(
        'La nueva contraseña debe ser diferente a la contraseña actual',
      );
    }

    user.passwordHash =
      await hash(
        cleanNewPassword,
        10,
      );

    user.mustChangePassword =
      false;

    await this.repo.save(user);

    await this.audit.log(
      current.sub,
      'CAMBIO_PASSWORD',
      'Usuario',
      user.id,
      `El usuario ${user.email} cambió su contraseña`,
    );

    return {
      message:
        'Contraseña actualizada correctamente',
    };
  }

  async softDelete(
    id: string,
    reason: string,
    current: any,
  ) {
    if (id === current.sub) {
      throw new BadRequestException(
        'No puede eliminar su propia cuenta administrativa',
      );
    }

    const user =
      await this.repo.findOne({
        where: { id },
      });

    if (!user) {
      throw new NotFoundException(
        'Usuario no encontrado',
      );
    }

    if (user.deletedAt) {
      throw new BadRequestException(
        'El usuario ya fue eliminado',
      );
    }

    const cleanReason =
      String(reason || '').trim();

    if (
      cleanReason.length < 5
    ) {
      throw new BadRequestException(
        'Debe indicar un motivo de eliminación',
      );
    }

    user.active = false;
    user.deletedAt =
      new Date();
    user.deletionReason =
      cleanReason;

    const saved =
      await this.repo.save(user);

    await this.audit.log(
      current.sub,
      'ELIMINACION_LOGICA',
      'Usuario',
      id,
      `Se eliminó lógicamente ${saved.email}. Motivo: ${cleanReason}`,
    );

    return this.getSafeUser(
      saved,
    );
  }

  async restore(
    id: string,
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

    if (!user.deletedAt) {
      throw new BadRequestException(
        'El usuario no está eliminado',
      );
    }

    user.deletedAt =
      null as any;
    user.deletionReason =
      null as any;
    user.active = true;

    const saved =
      await this.repo.save(user);

    await this.audit.log(
      current.sub,
      'RESTAURACION',
      'Usuario',
      id,
      `Se restauró el usuario ${saved.email}`,
    );

    return this.getSafeUser(
      saved,
    );
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

  async get(
    id: string,
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

    return item;
  }

  async create(
    dto: any,
    current: any,
    file?: any,
  ) {
    let responsible =
      dto.responsibleId
        ? await this.users.findOne({
            where: {
              id:
                dto.responsibleId,
            },
          })
        : null;

    if (!responsible) {
      responsible =
        await this.users.findOne({
          where: {
            id: current.sub,
          },
        });
    }

    const entity:
      RepositoryDocument =
      this.repo.create({
        name:
          dto.name,
        type:
          dto.type || 'Otro',
        category:
          dto.category || 'Otros',
        description:
          dto.description || null,
        version:
          dto.version || null,
        status:
          dto.status || 'ACTIVO',
        originalName:
          file?.originalname || null,
        storedName:
          file?.filename || null,
        mimeType:
          file?.mimetype || null,
        size:
          file?.size || null,
        responsible,
      } as Partial<RepositoryDocument>);

    const saved =
      await this.repo.save(
        entity,
      );

    await this.audit.log(
      current.sub,
      file
        ? 'CARGA'
        : 'CREACION',
      'Repositorio',
      saved.id,
      file
        ? `Se cargó ${file.originalname} como ${saved.name}`
        : `Se creó ${saved.name}`,
    );

    return saved;
  }

  async prepareDownload(
    id: string,
    current: any,
  ) {
    const item =
      await this.get(id);

    if (
      !item.storedName ||
      !item.originalName
    ) {
      throw new NotFoundException(
        'Este documento no tiene un archivo asociado',
      );
    }

    await this.audit.log(
      current.sub,
      'DESCARGA',
      'Repositorio',
      item.id,
      `Se descargó ${item.originalName}`,
    );

    return item;
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

    item.name =
      dto.name ?? item.name;

    item.type =
      dto.type ?? item.type;

    item.category =
      dto.category ??
      item.category;

    item.description =
      dto.description ??
      item.description;

    item.version =
      dto.version ??
      item.version;

    item.status =
      dto.status ??
      item.status;

    if (dto.responsibleId) {
      const responsible =
        await this.users.findOne({
          where: {
            id:
              dto.responsibleId,
          },
        });

      if (responsible) {
        item.responsible =
          responsible;
      }
    }

    const saved =
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

  async logResourcesZipDownload(
    id: string,
    current: any,
    fileCount: number,
  ) {
    const item =
      await this.get(id);

    await this.audit.log(
      current.sub,
      'DESCARGA_ZIP',
      'Procedimiento',
      item.id,
      `Se descargaron ${fileCount} recurso(s) relacionados en ZIP`,
    );

    return item;
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
    @InjectRepository(InstitutionalForm)
    private repo: Repository<InstitutionalForm>,
    @InjectRepository(User)
    private users: Repository<User>,
    private audit: AuditService,
  ) {}

  list() {
    return this.repo.find({ order: { updatedAt: 'DESC' } });
  }

  async get(id: string) {
    const form = await this.repo.findOne({ where: { id } });
    if (!form) throw new NotFoundException('Formulario no encontrado');
    return form;
  }

  async create(dto: any, current: any, file?: any) {
    const user = await this.users.findOne({ where: { id: current.sub } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const format = dto.format || file?.originalname?.split('.').pop()?.toUpperCase() || 'ARCHIVO';
    const entity = this.repo.create({
      name: dto.name,
      description: dto.description || null,
      category: dto.category || 'Otros',
      format,
      originalName: file?.originalname || null,
      storedName: file?.filename || null,
      mimeType: file?.mimetype || null,
      size: file?.size || null,
      createdBy: user,
      updatedBy: user,
    } as Partial<InstitutionalForm>);
    const saved = await this.repo.save(entity);
    await this.audit.log(current.sub, file ? 'CARGA' : 'CREACION', 'Formulario', saved.id, file ? `Se cargó ${file.originalname} como ${saved.name}` : `Se creó ${saved.name}`);
    return saved;
  }

  async update(id: string, dto: any, current: any) {
    const form = await this.get(id);
    const user = await this.users.findOne({ where: { id: current.sub } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    form.name = dto.name ?? form.name;
    form.description = dto.description ?? form.description;
    form.category = dto.category ?? form.category;
    form.format = dto.format ?? form.format;
    form.updatedBy = user;
    const saved = await this.repo.save(form);
    await this.audit.log(current.sub, 'ACTUALIZACION', 'Formulario', saved.id, `Se actualizó ${saved.name}`);
    return saved;
  }

  async prepareDownload(id: string, current: any) {
    const form = await this.get(id);
    if (!form.storedName || !form.originalName) throw new NotFoundException('Este formulario no tiene un archivo asociado');
    form.downloads = (form.downloads ?? 0) + 1;
    await this.repo.save(form);
    await this.audit.log(current.sub, 'DESCARGA', 'Formulario', id, `Se descargó ${form.originalName}`);
    return form;
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