import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  NotFoundException,
  OnModuleInit,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Folder,
  Procedure,
  RepositoryDocument,
} from './entities';

import { AuditService } from './services';
import { JwtAuthGuard } from './auth';
import { Role } from './roles';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

export const DEFAULT_FOLDER_CODE = 'SIN-CLASIFICAR';

type Counts = Map<
  string,
  { documents: number; procedures: number }
>;

/* =========================================================
   SERVICIO DE CARPETAS
========================================================= */

@Injectable()
export class FoldersService implements OnModuleInit {
  constructor(
    @InjectRepository(Folder)
    private repo: Repository<Folder>,

    @InjectRepository(RepositoryDocument)
    private documents: Repository<RepositoryDocument>,

    @InjectRepository(Procedure)
    private procedures: Repository<Procedure>,

    private audit: AuditService,
  ) {}

  /*
   * Al arrancar: crea la carpeta "Sin clasificar" y asigna
   * a ella todo documento o procedimiento sin carpeta.
   */
  async onModuleInit() {
    let defaultFolder = await this.repo.findOne({
      where: { code: DEFAULT_FOLDER_CODE },
    });

    if (!defaultFolder) {
      defaultFolder = await this.repo.save(
        this.repo.create({
          name: 'Sin clasificar',
          code: DEFAULT_FOLDER_CODE,
          description:
            'Documentos y procedimientos pendientes de ubicar en la estructura oficial.',
          sortOrder: 9999,
          parent: null,
        }),
      );
    }

    await this.repo.manager.query(
      'UPDATE repository_documents SET folder_id = $1 WHERE folder_id IS NULL',
      [defaultFolder.id],
    );

    await this.repo.manager.query(
      'UPDATE procedures SET folder_id = $1 WHERE folder_id IS NULL',
      [defaultFolder.id],
    );
  }

  /* ---------- utilidades internas ---------- */

  private all() {
    return this.repo.find({
      relations: { parent: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  private async counts(): Promise<Counts> {
    const map: Counts = new Map();

    const docs = await this.repo.manager.query(
      `SELECT folder_id AS "folderId", COUNT(*)::int AS total
       FROM repository_documents
       WHERE folder_id IS NOT NULL
       GROUP BY folder_id`,
    );

    const procs = await this.repo.manager.query(
      `SELECT folder_id AS "folderId", COUNT(*)::int AS total
       FROM procedures
       WHERE folder_id IS NOT NULL
       GROUP BY folder_id`,
    );

    for (const row of docs) {
      map.set(row.folderId, {
        documents: row.total,
        procedures: 0,
      });
    }

    for (const row of procs) {
      const current = map.get(row.folderId) || {
        documents: 0,
        procedures: 0,
      };
      current.procedures = row.total;
      map.set(row.folderId, current);
    }

    return map;
  }

  private childrenOf(folders: Folder[], id: string) {
    return folders.filter((f) => f.parent?.id === id);
  }

  /* Total de ítems de la carpeta y todas sus subcarpetas */
  private totalCount(
    folders: Folder[],
    counts: Counts,
    id: string,
  ): number {
    const own = counts.get(id);
    let total = (own?.documents || 0) + (own?.procedures || 0);

    for (const child of this.childrenOf(folders, id)) {
      total += this.totalCount(folders, counts, child.id);
    }

    return total;
  }

  private toNode(
    folder: Folder,
    folders: Folder[],
    counts: Counts,
  ) {
    const own = counts.get(folder.id);

    return {
      id: folder.id,
      name: folder.name,
      code: folder.code,
      description: folder.description,
      sortOrder: folder.sortOrder,
      parentId: folder.parent?.id ?? null,
      documentCount: own?.documents || 0,
      procedureCount: own?.procedures || 0,
      totalCount: this.totalCount(folders, counts, folder.id),
    };
  }

  private pathOf(folder: Folder, folders: Folder[]) {
    const byId = new Map(folders.map((f) => [f.id, f]));
    const path: { id: string; name: string }[] = [];
    let cursor: Folder | undefined = folder;
    let guard = 0;

    while (cursor && guard < 50) {
      path.unshift({ id: cursor.id, name: cursor.name });
      cursor = cursor.parent
        ? byId.get(cursor.parent.id)
        : undefined;
      guard += 1;
    }

    return path;
  }

  private async ensureUniqueName(
    name: string,
    parentId: string | null,
    excludeId?: string,
  ) {
    const folders = await this.all();

    const clash = folders.find(
      (f) =>
        (f.parent?.id ?? null) === parentId &&
        f.id !== excludeId &&
        f.name.toLowerCase() === name.toLowerCase(),
    );

    if (clash) {
      throw new BadRequestException(
        'Ya existe una carpeta con ese nombre en esta ubicación',
      );
    }
  }

  /* ---------- consulta ---------- */

  async tree() {
    const folders = await this.all();
    const counts = await this.counts();

    const build = (parentId: string | null): any[] =>
      folders
        .filter((f) => (f.parent?.id ?? null) === parentId)
        .map((f) => ({
          ...this.toNode(f, folders, counts),
          children: build(f.id),
        }));

    return build(null);
  }

  async contents(id: string) {
    const folders = await this.all();
    const folder = folders.find((f) => f.id === id);

    if (!folder) {
      throw new NotFoundException('Carpeta no encontrada');
    }

    const counts = await this.counts();

    const documents = await this.documents.find({
      where: { folder: { id } } as any,
      order: { name: 'ASC' },
    });

    const procedures = await this.procedures.find({
      where: { folder: { id } } as any,
      order: { code: 'ASC' },
    });

    return {
      folder: this.toNode(folder, folders, counts),
      path: this.pathOf(folder, folders),
      subfolders: this.childrenOf(folders, id).map((f) =>
        this.toNode(f, folders, counts),
      ),
      documents,
      procedures,
    };
  }

  /* ---------- administración (solo ADMIN) ---------- */

  async create(dto: any, current: any) {
    const name = String(dto.name || '').trim();

    if (!name) {
      throw new BadRequestException(
        'El nombre de la carpeta es obligatorio',
      );
    }

    let parent: Folder | null = null;

    if (dto.parentId) {
      parent = await this.repo.findOne({
        where: { id: dto.parentId },
      });

      if (!parent) {
        throw new NotFoundException(
          'La carpeta padre no existe',
        );
      }
    }

    await this.ensureUniqueName(name, parent?.id ?? null);

    const saved = await this.repo.save(
      this.repo.create({
        name,
        code: String(dto.code || '').trim() || null,
        description:
          String(dto.description || '').trim() || null,
        sortOrder: Number(dto.sortOrder) || 0,
        parent,
      } as any),
    );

    const savedFolder = saved as unknown as Folder;

    await this.audit.log(
      current.sub,
      'CREACION',
      'Carpeta',
      savedFolder.id,
      `Se creó la carpeta ${savedFolder.name}`,
    );

    return savedFolder;
  }

  async update(id: string, dto: any, current: any) {
    const folders = await this.all();
    const folder = folders.find((f) => f.id === id);

    if (!folder) {
      throw new NotFoundException('Carpeta no encontrada');
    }

    const previousName = folder.name;
    let newParentId: string | null =
      folder.parent?.id ?? null;
    let moved = false;

    if ('parentId' in dto) {
      newParentId = dto.parentId || null;

      if (newParentId === id) {
        throw new BadRequestException(
          'Una carpeta no puede ser su propia subcarpeta',
        );
      }

      if (newParentId) {
        const newParent = folders.find(
          (f) => f.id === newParentId,
        );

        if (!newParent) {
          throw new NotFoundException(
            'La carpeta destino no existe',
          );
        }

        // Impide mover una carpeta dentro de sus descendientes.
        const byId = new Map(folders.map((f) => [f.id, f]));
        let cursor: Folder | undefined = newParent;
        let guard = 0;

        while (cursor && guard < 50) {
          if (cursor.id === id) {
            throw new BadRequestException(
              'No puede mover una carpeta dentro de una de sus subcarpetas',
            );
          }
          cursor = cursor.parent
            ? byId.get(cursor.parent.id)
            : undefined;
          guard += 1;
        }

        folder.parent = newParent;
      } else {
        folder.parent = null;
      }

      moved = newParentId !== (folder.parent?.id ?? null) || true;
    }

    if (dto.name !== undefined) {
      const name = String(dto.name).trim();

      if (!name) {
        throw new BadRequestException(
          'El nombre de la carpeta es obligatorio',
        );
      }

      folder.name = name;
    }

    await this.ensureUniqueName(folder.name, newParentId, id);

    if (dto.code !== undefined) {
      folder.code = String(dto.code || '').trim() || (null as any);
    }

    if (dto.description !== undefined) {
      folder.description =
        String(dto.description || '').trim() || (null as any);
    }

    if (dto.sortOrder !== undefined) {
      folder.sortOrder = Number(dto.sortOrder) || 0;
    }

    const saved = await this.repo.save(folder);

    await this.audit.log(
      current.sub,
      'ACTUALIZACION',
      'Carpeta',
      id,
      moved && 'parentId' in dto
        ? `Se actualizó/movió la carpeta ${previousName} → ${saved.name}`
        : `Se actualizó la carpeta ${previousName} → ${saved.name}`,
    );

    return saved;
  }

  async remove(id: string, current: any) {
    const folder = await this.repo.findOne({
      where: { id },
    });

    if (!folder) {
      throw new NotFoundException('Carpeta no encontrada');
    }

    if (folder.code === DEFAULT_FOLDER_CODE) {
      throw new BadRequestException(
        'La carpeta "Sin clasificar" no se puede eliminar',
      );
    }

    const children = await this.repo.count({
      where: { parent: { id } } as any,
    });

    const docs = await this.documents.count({
      where: { folder: { id } } as any,
    });

    const procs = await this.procedures.count({
      where: { folder: { id } } as any,
    });

    if (children || docs || procs) {
      throw new BadRequestException(
        'La carpeta no está vacía. Mueva o elimine primero sus subcarpetas, documentos y procedimientos',
      );
    }

    await this.repo.remove(folder);

    await this.audit.log(
      current.sub,
      'ELIMINACION',
      'Carpeta',
      id,
      `Se eliminó la carpeta ${folder.name}`,
    );

    return { message: 'Carpeta eliminada' };
  }
}

/* =========================================================
   CONTROLADOR DE CARPETAS

   CONSULTA:  ADMIN / EDITOR / CONSULTOR
   GESTIÓN:   ADMIN
========================================================= */

@Controller('folders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FoldersController {
  constructor(private readonly service: FoldersService) {}

  @Get('tree')
  @Roles(Role.ADMIN, Role.EDITOR, Role.CONSULTOR)
  tree() {
    return this.service.tree();
  }

  @Get(':id/contents')
  @Roles(Role.ADMIN, Role.EDITOR, Role.CONSULTOR)
  contents(@Param('id') id: string) {
    return this.service.contents(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() body: any, @Req() request: any) {
    return this.service.create(body, request.user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() body: any,
    @Req() request: any,
  ) {
    return this.service.update(id, body, request.user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string, @Req() request: any) {
    return this.service.remove(id, request.user);
  }
}