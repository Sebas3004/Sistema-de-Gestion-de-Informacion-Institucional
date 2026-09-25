import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import {
  FileInterceptor,
} from '@nestjs/platform-express';

import {
  diskStorage,
} from 'multer';

import {
  extname,
  join,
} from 'path';

import {
  existsSync,
  mkdirSync,
} from 'fs';

import archiver = require('archiver');

/* =========================================================
   AUTENTICACIÓN
========================================================= */

import {
  AuthService,
  JwtAuthGuard,
} from './auth';

/* =========================================================
   ROLES
========================================================= */

import {
  Role,
} from './roles';

import {
  Roles,
} from './roles.decorator';

import {
  RolesGuard,
} from './roles.guard';

/* =========================================================
   SERVICIOS
========================================================= */

import {
  AuditService,
  CorrespondenceService,
  FormsService,
  LinksService,
  NewsService,
  ProcedureService,
  RepositoryService,
  UsersService,
} from './services';

/* =========================================================
   AUTH
========================================================= */

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users:
      UsersService,
  ) {}

  @Post('login')
  login(
    @Body()
    body: {
      email: string;
      password: string;
    },
  ) {
    return this.auth.login(
      body.email,
      body.password,
    );
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Body()
    body: {
      currentPassword: string;
      newPassword: string;
    },

    @Req()
    request: any,
  ) {
    return this.users
      .changeOwnPassword(
        request.user,
        body.currentPassword,
        body.newPassword,
      );
  }
}

/* =========================================================
   USUARIOS
   SOLO ADMIN
========================================================= */

@Controller('users')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
@Roles(Role.ADMIN)
export class UsersController {
  constructor(
    private readonly service:
      UsersService,
  ) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Post()
  create(
    @Body() body: any,
    @Req() request: any,
  ) {
    return this.service.create(
      body,
      request.user,
    );
  }

  @Patch(':id')
  update(
    @Param('id')
    id: string,

    @Body()
    body: any,

    @Req()
    request: any,
  ) {
    return this.service.update(
      id,
      body,
      request.user,
    );
  }

  @Patch(':id/reset-password')
  resetPassword(
    @Param('id')
    id: string,

    @Body()
    body: {
      password?: string;
    },

    @Req()
    request: any,
  ) {
    return this.service
      .resetPassword(
        id,
        request.user,
        body.password,
      );
  }

  @Patch(':id/delete')
  softDelete(
    @Param('id')
    id: string,

    @Body()
    body: {
      reason: string;
    },

    @Req()
    request: any,
  ) {
    return this.service.softDelete(
      id,
      body.reason,
      request.user,
    );
  }

  @Patch(':id/restore')
  restore(
    @Param('id')
    id: string,

    @Req()
    request: any,
  ) {
    return this.service.restore(
      id,
      request.user,
    );
  }
}

/* =========================================================
   CORRESPONDENCIA
   ADMIN + EDITOR
========================================================= */

@Controller('correspondence')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
@Roles(
  Role.ADMIN,
  Role.EDITOR,
)
export class CorrespondenceController {
  constructor(
    private readonly service:
      CorrespondenceService,
  ) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':id')
  get(
    @Param('id')
    id: string,
  ) {
    return this.service.get(
      id,
    );
  }

  @Post()
  create(
    @Body()
    body: any,

    @Req()
    request: any,
  ) {
    return this.service.create(
      body,
      request.user,
    );
  }

  @Patch(':id')
  update(
    @Param('id')
    id: string,

    @Body()
    body: any,

    @Req()
    request: any,
  ) {
    return this.service.update(
      id,
      body,
      request.user,
    );
  }

  /* =======================================================
     COMENTARIOS
  ======================================================= */

  @Post(':id/comments')
  comment(
    @Param('id')
    id: string,

    @Body()
    body: {
      body: string;
    },

    @Req()
    request: any,
  ) {
    return this.service.addComment(
      id,
      body.body,
      request.user,
    );
  }

  /* =======================================================
     ARCHIVOS ADJUNTOS
  ======================================================= */

  @Post(':id/attachments')
  @UseInterceptors(
    FileInterceptor(
      'file',
      {
        storage:
          diskStorage({
            destination:
              process.env
                .UPLOAD_DIR ||
              './uploads',

            filename: (
              _request,
              file,
              callback,
            ) => {
              const uniqueName =
                `${Date.now()}-` +
                `${Math.round(
                  Math.random() *
                    1e9,
                )}` +
                `${extname(
                  file.originalname,
                )}`;

              callback(
                null,
                uniqueName,
              );
            },
          }),
      },
    ),
  )
  attachment(
    @Param('id')
    id: string,

    @UploadedFile()
    file: any,

    @Req()
    request: any,
  ) {
    return this.service
      .addAttachment(
        id,
        file,
        request.user,
      );
  }
}

/* =========================================================
   REPOSITORIO

   CONSULTA:
   ADMIN / EDITOR / CONSULTOR

   CREAR / EDITAR:
   ADMIN / EDITOR
========================================================= */

@Controller('repository')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class RepositoryController {
  constructor(
    private readonly service:
      RepositoryService,
  ) {}

  @Get()
  @Roles(
    Role.ADMIN,
    Role.EDITOR,
    Role.CONSULTOR,
  )
  list() {
    return this.service.list();
  }

  @Get(':id')
  @Roles(
    Role.ADMIN,
    Role.EDITOR,
    Role.CONSULTOR,
  )
  get(
    @Param('id')
    id: string,
  ) {
    return this.service.get(id);
  }

  @Post('upload')
  @Roles(
    Role.ADMIN,
    Role.EDITOR,
  )
  @UseInterceptors(
    FileInterceptor(
      'file',
      {
        storage:
          diskStorage({
            destination: (
              _request,
              _file,
              callback,
            ) => {
              const directory =
                process.env
                  .UPLOAD_DIR ||
                './uploads';

              mkdirSync(
                directory,
                {
                  recursive: true,
                },
              );

              callback(
                null,
                directory,
              );
            },

            filename: (
              _request,
              file,
              callback,
            ) => {
              const uniqueName =
                `${Date.now()}-` +
                `${Math.round(
                  Math.random() *
                    1e9,
                )}` +
                `${extname(
                  file.originalname,
                )}`;

              callback(
                null,
                uniqueName,
              );
            },
          }),
      },
    ),
  )
  upload(
    @Body()
    body: any,

    @UploadedFile()
    file: any,

    @Req()
    request: any,
  ) {
    if (!file) {
      throw new Error(
        'Debe seleccionar un archivo',
      );
    }

    return this.service.create(
      body,
      request.user,
      file,
    );
  }

  @Get(':id/download')
  @Roles(
    Role.ADMIN,
    Role.EDITOR,
    Role.CONSULTOR,
  )
  async download(
    @Param('id')
    id: string,

    @Req()
    request: any,

    @Res()
    response: any,
  ) {
    const item =
      await this.service
        .prepareDownload(
          id,
          request.user,
        );

    const directory =
      process.env.UPLOAD_DIR ||
      './uploads';

    const filePath =
      join(
        directory,
        item.storedName,
      );

    if (!existsSync(filePath)) {
      return response
        .status(404)
        .json({
          message:
            'El archivo físico no se encuentra disponible',
        });
    }

    return response.download(
      filePath,
      item.originalName,
    );
  }

  @Post()
  @Roles(
    Role.ADMIN,
    Role.EDITOR,
  )
  create(
    @Body()
    body: any,

    @Req()
    request: any,
  ) {
    return this.service.create(
      body,
      request.user,
    );
  }

  @Patch(':id')
  @Roles(
    Role.ADMIN,
    Role.EDITOR,
  )
  update(
    @Param('id')
    id: string,

    @Body()
    body: any,

    @Req()
    request: any,
  ) {
    return this.service.update(
      id,
      body,
      request.user,
    );
  }
}

/* =========================================================
   PROCEDIMIENTOS
========================================================= */

@Controller('procedures')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class ProcedureController {
  constructor(
    private readonly service:
      ProcedureService,

    private readonly repositoryService:
      RepositoryService,

    private readonly formsService:
      FormsService,
  ) {}

  @Get()
  @Roles(
    Role.ADMIN,
    Role.EDITOR,
    Role.CONSULTOR,
  )
  list() {
    return this.service.list();
  }

  @Get(':id/resources/download-all')
  @Roles(
    Role.ADMIN,
    Role.EDITOR,
    Role.CONSULTOR,
  )
  async downloadAllResources(
    @Param('id')
    id: string,

    @Req()
    request: any,

    @Res()
    response: any,
  ) {
    const procedure =
      await this.service.get(id);

    const directory =
      process.env.UPLOAD_DIR ||
      './uploads';

    const files: Array<{
      sourcePath: string;
      zipPath: string;
      kind: 'repository' | 'form';
      id: string;
    }> = [];

    const safeName = (
      value: string,
    ) =>
      value
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
        .trim() ||
      'archivo';

    const documentRelations =
      Array.isArray(
        procedure.relatedDocuments,
      )
        ? procedure.relatedDocuments
        : [];

    for (
      let index = 0;
      index <
      documentRelations.length;
      index += 1
    ) {
      const relation =
        documentRelations[index];

      if (!relation?.documentId) {
        continue;
      }

      try {
        const document =
          await this.repositoryService.get(
            relation.documentId,
          );

        if (
          !document.storedName ||
          !document.originalName
        ) {
          continue;
        }

        const sourcePath =
          join(
            directory,
            document.storedName,
          );

        if (!existsSync(sourcePath)) {
          continue;
        }

        files.push({
          sourcePath,
          zipPath:
            `documentos/${index + 1}-` +
            safeName(
              document.originalName,
            ),
          kind: 'repository',
          id: document.id,
        });
      } catch {
        // Si un recurso fue eliminado o ya no existe,
        // simplemente no se incluye en el ZIP.
      }
    }

    const formRelations =
      Array.isArray(
        procedure.relatedForms,
      )
        ? procedure.relatedForms
        : [];

    for (
      let index = 0;
      index <
      formRelations.length;
      index += 1
    ) {
      const relation =
        formRelations[index];

      if (!relation?.formId) {
        continue;
      }

      try {
        const form =
          await this.formsService.get(
            relation.formId,
          );

        if (
          !form.storedName ||
          !form.originalName
        ) {
          continue;
        }

        const sourcePath =
          join(
            directory,
            form.storedName,
          );

        if (!existsSync(sourcePath)) {
          continue;
        }

        files.push({
          sourcePath,
          zipPath:
            `formularios/${index + 1}-` +
            safeName(
              form.originalName,
            ),
          kind: 'form',
          id: form.id,
        });
      } catch {
        // Recurso inexistente: se omite.
      }
    }

    if (!files.length) {
      return response
        .status(404)
        .json({
          message:
            'No hay archivos relacionados disponibles para descargar',
        });
    }

    // Registra las descargas individuales para conservar
    // auditoría y contador de formularios.
    for (const file of files) {
      if (
        file.kind ===
        'repository'
      ) {
        await this.repositoryService
          .prepareDownload(
            file.id,
            request.user,
          );
      } else {
        await this.formsService
          .prepareDownload(
            file.id,
            request.user,
          );
      }
    }

    await this.service
      .logResourcesZipDownload(
        id,
        request.user,
        files.length,
      );

    const zipBaseName =
      safeName(
        procedure.code ||
        procedure.name ||
        'procedimiento',
      );

    response.setHeader(
      'Content-Type',
      'application/zip',
    );

    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${zipBaseName}-recursos.zip"`,
    );

    const archive =
      archiver(
        'zip',
        {
          zlib: {
            level: 9,
          },
        },
      );

    archive.on(
      'error',
      (error) => {
        console.error(
          'Error generando ZIP:',
          error,
        );

        if (
          !response.headersSent
        ) {
          response
            .status(500)
            .json({
              message:
                'No se pudo generar el archivo ZIP',
            });
        } else {
          response.end();
        }
      },
    );

    archive.pipe(response);

    files.forEach(
      (file) => {
        archive.file(
          file.sourcePath,
          {
            name:
              file.zipPath,
          },
        );
      },
    );

    await archive.finalize();
  }


  @Get(':id')
  @Roles(
    Role.ADMIN,
    Role.EDITOR,
    Role.CONSULTOR,
  )
  get(
    @Param('id')
    id: string,
  ) {
    return this.service.get(id);
  }

  @Post()
  @Roles(
    Role.ADMIN,
    Role.EDITOR,
  )
  create(
    @Body()
    body: any,

    @Req()
    request: any,
  ) {
    return this.service.create(
      body,
      request.user,
    );
  }

  @Patch(':id')
  @Roles(
    Role.ADMIN,
    Role.EDITOR,
  )
  update(
    @Param('id')
    id: string,

    @Body()
    body: any,

    @Req()
    request: any,
  ) {
    return this.service.update(
      id,
      body,
      request.user,
    );
  }
}

/* =========================================================
   FORMULARIOS
========================================================= */

@Controller('forms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FormsController {
  constructor(private readonly service: FormsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.EDITOR, Role.CONSULTOR)
  list() { return this.service.list(); }

  @Get(':id')
  @Roles(Role.ADMIN, Role.EDITOR, Role.CONSULTOR)
  get(@Param('id') id: string) { return this.service.get(id); }

  @Post('upload')
  @Roles(Role.ADMIN, Role.EDITOR)
  @UseInterceptors(FileInterceptor('file', { storage: diskStorage({
    destination: (_request, _file, callback) => {
      const directory = process.env.UPLOAD_DIR || './uploads';
      mkdirSync(directory, { recursive: true });
      callback(null, directory);
    },
    filename: (_request, file, callback) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random()*1e9)}${extname(file.originalname)}`;
      callback(null, uniqueName);
    },
  }) }))
  upload(@Body() body: any, @UploadedFile() file: any, @Req() request: any) {
    if (!file) throw new Error('Debe seleccionar un archivo');
    return this.service.create(body, request.user, file);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.EDITOR)
  update(@Param('id') id: string, @Body() body: any, @Req() request: any) {
    return this.service.update(id, body, request.user);
  }

  @Get(':id/download')
  @Roles(Role.ADMIN, Role.EDITOR, Role.CONSULTOR)
  async download(@Param('id') id: string, @Req() request: any, @Res() response: any) {
    const form = await this.service.prepareDownload(id, request.user);
    const directory = process.env.UPLOAD_DIR || './uploads';
    const filePath = join(directory, form.storedName);
    if (!existsSync(filePath)) return response.status(404).json({ message: 'El archivo físico no se encuentra disponible' });
    return response.download(filePath, form.originalName);
  }

  @Post()
  @Roles(Role.ADMIN, Role.EDITOR)
  create(@Body() body: any, @Req() request: any) {
    return this.service.create(body, request.user);
  }
}

/* =========================================================
   ENLACES A SISTEMAS
========================================================= */

@Controller('links')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class LinksController {
  constructor(
    private readonly service:
      LinksService,
  ) {}

  @Get()
  @Roles(
    Role.ADMIN,
    Role.EDITOR,
    Role.CONSULTOR,
  )
  list() {
    return this.service.list();
  }

  @Post()
  @Roles(
    Role.ADMIN,
    Role.EDITOR,
  )
  create(
    @Body()
    body: any,
  ) {
    return this.service.create(
      body,
    );
  }
}

/* =========================================================
   NOTICIAS
========================================================= */

@Controller('news')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class NewsController {
  constructor(
    private readonly service:
      NewsService,
  ) {}

  @Get()
  @Roles(
    Role.ADMIN,
    Role.EDITOR,
    Role.CONSULTOR,
  )
  list() {
    return this.service.list();
  }

  @Post()
  @Roles(
    Role.ADMIN,
    Role.EDITOR,
  )
  create(
    @Body()
    body: any,

    @Req()
    request: any,
  ) {
    return this.service.create(
      body,
      request.user,
    );
  }
}

/* =========================================================
   HISTORIAL
========================================================= */

@Controller('audit')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class AuditController {
  constructor(
    private readonly service:
      AuditService,
  ) {}

  /*
   * Cualquier usuario autenticado
   * puede consultar SU historial.
   */
  @Get('mine')
  @Roles(
    Role.ADMIN,
    Role.EDITOR,
    Role.CONSULTOR,
  )
  mine(
    @Req()
    request: any,
  ) {
    return this.service.list(
      request.user,
      false,
    );
  }

  /*
   * Solamente ADMIN puede consultar
   * el historial completo.
   */
  @Get('all')
  @Roles(Role.ADMIN)
  all(
    @Req()
    request: any,
  ) {
    return this.service.list(
      request.user,
      true,
    );
  }
}