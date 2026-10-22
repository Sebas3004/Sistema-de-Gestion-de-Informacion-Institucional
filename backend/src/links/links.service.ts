import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import {
  ExternalLink,
  User,
} from '../entities';

import { AuditService } from '../services';

import {
  CreateLinkDto,
  ListLinksQueryDto,
  UpdateLinkDto,
} from './links.dto';

/*
 * Campos que se comparan para el detalle de auditoría.
 */
const TRACKED_FIELDS = [
  'name',
  'url',
  'description',
  'category',
  'type',
  'requiresInstitutionalNetwork',
  'sortOrder',
] as const;

/* =========================================================
   SERVICIO DE ENLACES
========================================================= */

@Injectable()
export class LinksService {
  constructor(
    @InjectRepository(ExternalLink)
    private repo: Repository<ExternalLink>,

    @InjectRepository(User)
    private users: Repository<User>,

    private audit: AuditService,
  ) {}

  /*
   * Consulta: solo enlaces activos.
   */
  list(query: ListLinksQueryDto) {
    const qb = this.repo
      .createQueryBuilder('link')
      .where('link.active = :active', {
        active: true,
      });

    if (query.type) {
      qb.andWhere('link.type = :type', {
        type: query.type,
      });
    }

    if (query.category) {
      qb.andWhere(
        'LOWER(link.category) = LOWER(:category)',
        {
          category: query.category,
        },
      );
    }

    if (query.q) {
      const pattern = `%${query.q.replace(
        /[\\%_]/g,
        (char) => `\\${char}`,
      )}%`;

      qb.andWhere(
        '(link.name ILIKE :q OR link.description ILIKE :q)',
        {
          q: pattern,
        },
      );
    }

    return qb
      .orderBy('link.type', 'ASC')
      .addOrderBy('link.category', 'ASC')
      .addOrderBy('link.sortOrder', 'ASC')
      // Sin distinguir mayúsculas: "prueba" antes que "TEC Digital".
      .addOrderBy('LOWER(link.name)', 'ASC')
      .getMany();
  }

  /*
   * Gestión: incluye inactivos y quién creó/editó.
   * (QueryBuilder no carga relaciones eager: se unen a mano.)
   */
  listAll() {
    return this.repo
      .createQueryBuilder('link')
      .leftJoinAndSelect('link.createdBy', 'createdBy')
      .leftJoinAndSelect('link.updatedBy', 'updatedBy')
      .orderBy('link.type', 'ASC')
      .addOrderBy('link.category', 'ASC')
      .addOrderBy('link.sortOrder', 'ASC')
      .addOrderBy('LOWER(link.name)', 'ASC')
      .getMany();
  }

  async create(
    dto: CreateLinkDto,
    current: any,
  ) {
    this.assertSafeUrl(dto.url);

    const user = await this.currentUser(current);

    const entity = this.repo.create({
      name: dto.name,
      url: dto.url,
      description: dto.description || null,
      category: dto.category,
      type: dto.type,
      requiresInstitutionalNetwork:
        dto.requiresInstitutionalNetwork ?? false,
      sortOrder: dto.sortOrder ?? 0,
      active: true,
      createdBy: user,
      updatedBy: user,
    } as Partial<ExternalLink>);

    const saved = await this.repo.save(entity);

    await this.audit.log(
      current.sub,
      'CREACION',
      'Enlace',
      saved.id,
      `Se creó el enlace ${saved.name} | Tipo: ${saved.type} | URL: ${saved.url}`,
    );

    return saved;
  }

  async update(
    id: string,
    dto: UpdateLinkDto,
    current: any,
  ) {
    const link = await this.findOrFail(id);

    if (dto.url !== undefined) {
      this.assertSafeUrl(dto.url);
    }

    const changes: string[] = [];

    for (const field of TRACKED_FIELDS) {
      if (dto[field] === undefined) {
        continue;
      }

      const next =
        field === 'description'
          ? dto.description || null
          : dto[field];

      if ((link[field] ?? null) === next) {
        continue;
      }

      changes.push(
        `${field}: ${link[field] ?? '-'} → ${next ?? '-'}`,
      );

      (link as any)[field] = next;
    }

    if (!changes.length) {
      return link;
    }

    link.updatedBy = await this.currentUser(current);

    const saved = await this.repo.save(link);

    await this.audit.log(
      current.sub,
      'ACTUALIZACION',
      'Enlace',
      saved.id,
      `Se actualizó el enlace ${saved.name} | Tipo: ${saved.type} | URL: ${saved.url} | Cambios: ${changes.join('; ')}`,
    );

    return saved;
  }

  async deactivate(
    id: string,
    current: any,
  ) {
    const link = await this.findOrFail(id);

    if (!link.active) {
      throw new BadRequestException(
        'El enlace ya está inactivo',
      );
    }

    link.active = false;
    link.updatedBy = await this.currentUser(current);

    const saved = await this.repo.save(link);

    await this.audit.log(
      current.sub,
      'ELIMINACION_LOGICA',
      'Enlace',
      saved.id,
      `Se desactivó el enlace ${saved.name} | Tipo: ${saved.type} | URL: ${saved.url}`,
    );

    return saved;
  }

  async restore(
    id: string,
    current: any,
  ) {
    const link = await this.findOrFail(id);

    if (link.active) {
      throw new BadRequestException(
        'El enlace ya está activo',
      );
    }

    link.active = true;
    link.updatedBy = await this.currentUser(current);

    const saved = await this.repo.save(link);

    await this.audit.log(
      current.sub,
      'RESTAURACION',
      'Enlace',
      saved.id,
      `Se restauró el enlace ${saved.name} | Tipo: ${saved.type} | URL: ${saved.url}`,
    );

    return saved;
  }

  /* =======================================================
     HELPERS
  ======================================================= */

  private async findOrFail(id: string) {
    const link = await this.repo.findOne({
      where: { id },
    });

    if (!link) {
      throw new NotFoundException(
        'Enlace no encontrado',
      );
    }

    return link;
  }

  private async currentUser(current: any) {
    return this.users.findOne({
      where: {
        id: current.sub,
      },
    });
  }

  /*
   * Defensa en profundidad: el DTO ya valida con @IsUrl,
   * pero aquí se exige además que el protocolo real sea
   * http o https (evita javascript:, data:, etc.).
   */
  private assertSafeUrl(value: string) {
    let parsed: URL;

    try {
      parsed = new URL(value);
    } catch {
      throw new BadRequestException(
        'La URL no es válida',
      );
    }

    if (
      parsed.protocol !== 'http:' &&
      parsed.protocol !== 'https:'
    ) {
      throw new BadRequestException(
        'La URL debe comenzar con http:// o https://',
      );
    }
  }
}
