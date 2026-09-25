import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
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
} from 'path';

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
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class FormsController {
  constructor(
    private readonly service:
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

  /*
   * Por ahora este endpoint registra
   * la descarga según FormsService.
   *
   * Más adelante conectaremos el
   * archivo físico para que el navegador
   * realmente lo descargue.
   */
  @Post(':id/download')
  @Roles(
    Role.ADMIN,
    Role.EDITOR,
    Role.CONSULTOR,
  )
  download(
    @Param('id')
    id: string,

    @Req()
    request: any,
  ) {
    return this.service.download(
      id,
      request.user,
    );
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