import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import {
  FileInterceptor,
} from '@nestjs/platform-express';

import {
  diskStorage,
} from 'multer';

import {
  existsSync,
  mkdirSync,
} from 'fs';

import {
  extname,
} from 'path';

import {
  JwtAuthGuard,
} from '../auth';

import {
  Role,
} from '../roles';

import {
  Roles,
} from '../roles.decorator';

import {
  RolesGuard,
} from '../roles.guard';

import {
  resolveUploadPath,
} from '../upload-path';

import {
  CisetReviewDto,
  CreateEspurgoRequestDto,
  DirectorDecisionDto,
} from './espurgo.dto';

import {
  EspurgoService,
} from './espurgo.service';

/* =========================================================
   ESPURGO DOCUMENTAL - REQ-ESP-003

   CONSULTA:
   ADMIN / EDITOR

   CREAR SOLICITUD:
   ADMIN / EDITOR

   REVISIÓN CISET:
   ADMIN / EDITOR

   DECISIÓN DE DIRECCIÓN:
   ADMIN

   REGISTRO DE ACTA:
   ADMIN
========================================================= */

@Controller('espurgo')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
@UsePipes(
  new ValidationPipe({
    whitelist:
      true,

    forbidNonWhitelisted:
      true,

    transform:
      true,
  }),
)
export class EspurgoController {
  constructor(
    private readonly service:
      EspurgoService,
  ) {}

  /* =======================================================
     CONSULTA
  ======================================================= */

  @Get()
  @Roles(
    Role.ADMIN,
    Role.EDITOR,
  )
  list() {
    return this.service.list();
  }

  @Get(':id')
  @Roles(
    Role.ADMIN,
    Role.EDITOR,
  )
  get(
    @Param(
      'id',
      ParseUUIDPipe,
    )
    id: string,
  ) {
    return this.service.get(
      id,
    );
  }

  /* =======================================================
     CREAR SOLICITUD
  ======================================================= */

  @Post()
  @Roles(
    Role.ADMIN,
    Role.EDITOR,
  )
  create(
    @Body()
    body:
      CreateEspurgoRequestDto,

    @Req()
    request: any,
  ) {
    return this.service.create(
      body,
      request.user,
    );
  }

  /* =======================================================
     REVISIÓN CISET
  ======================================================= */

  @Patch(
    ':id/ciset-review',
  )
  @Roles(
    Role.ADMIN,
    Role.EDITOR,
  )
  reviewByCiset(
    @Param(
      'id',
      ParseUUIDPipe,
    )
    id: string,

    @Body()
    body:
      CisetReviewDto,

    @Req()
    request: any,
  ) {
    return this.service
      .reviewByCiset(
        id,
        body,
        request.user,
      );
  }

  /* =======================================================
     APROBACIÓN / RECHAZO DE DIRECCIÓN
  ======================================================= */

  @Patch(
    ':id/director-decision',
  )
  @Roles(
    Role.ADMIN,
  )
  directorDecision(
    @Param(
      'id',
      ParseUUIDPipe,
    )
    id: string,

    @Body()
    body:
      DirectorDecisionDto,

    @Req()
    request: any,
  ) {
    return this.service
      .directorDecision(
        id,
        body,
        request.user,
      );
  }

  /* =======================================================
     CARGA DEL ACTA FIRMADA
  ======================================================= */

  @Post(
    ':id/act',
  )
  @Roles(
    Role.ADMIN,
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
                  recursive:
                    true,
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
                `espurgo-acta-` +
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

        limits: {
          fileSize:
            10 *
            1024 *
            1024,
        },
      },
    ),
  )
  uploadAct(
    @Param(
      'id',
      ParseUUIDPipe,
    )
    id: string,

    @UploadedFile()
    file: any,

    @Req()
    request: any,
  ) {
    return this.service
      .uploadAct(
        id,
        file,
        request.user,
      );
  }

  /* =======================================================
     DESCARGA DEL ACTA
  ======================================================= */

  @Get(
    ':id/act/download',
  )
  @Roles(
    Role.ADMIN,
    Role.EDITOR,
  )
  async downloadAct(
    @Param(
      'id',
      ParseUUIDPipe,
    )
    id: string,

    @Req()
    request: any,

    @Res()
    response: any,
  ) {
    const espurgo =
      await this.service
        .prepareActDownload(
          id,
          request.user,
        );

    let filePath:
      string;

    try {
      filePath =
        resolveUploadPath(
          espurgo
            .actStoredName,
        );
    } catch {
      return response
        .status(404)
        .json({
          message:
            'El archivo del acta no se encuentra disponible',
        });
    }

    if (
      !existsSync(
        filePath,
      )
    ) {
      return response
        .status(404)
        .json({
          message:
            'El archivo físico del acta no se encuentra disponible',
        });
    }

    return response
      .download(
        filePath,
        espurgo
          .actOriginalName,
      );
  }
}