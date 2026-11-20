import {
  Module,
} from '@nestjs/common';

import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';

import {
  JwtModule,
} from '@nestjs/jwt';

import {
  TypeOrmModule,
} from '@nestjs/typeorm';

import { POSTGRES_UTC_SESSION } from './pg-utc';

/* =========================================================
   ENTIDADES
========================================================= */

import {
  AuditLog,
  Correspondence,
  CorrespondenceAttachment,
  CorrespondenceComment,
  Expediente,
  ExternalLink,
  Folder,
  InstitutionalCorrespondence,
  InstitutionalCorrespondenceAttachment,
  InstitutionalForm,
  News,
  Procedure,
  ProcedureStep,
  RepositoryDocument,
  Role,
  User,
  EspurgoRequest,
} from './entities';

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
  RolesGuard,
} from './roles.guard';

/* =========================================================
   SERVICIOS
========================================================= */

import {
  AuditService,
  CorrespondenceService,
  FormsService,
  InstitutionalCorrespondenceService,
  NewsService,
  ProcedureService,
  RepositoryService,
  UsersService,
} from './services';

/* =========================================================
   CARPETAS INSTITUCIONALES
========================================================= */

import {
  FoldersController,
  FoldersService,
} from './folders';

import {
  FolderImportService,
} from './folder-import.service';

/* =========================================================
   ENLACES (ACCESOS RÁPIDOS)
========================================================= */

import { LinksController } from './links/links.controller';
import { LinksService } from './links/links.service';

/* =========================================================
   EXPEDIENTES (REQ-EXP-002.1)
========================================================= */

import { ExpedientesController } from './expedientes/expedientes.controller';
import { ExpedientesService } from './expedientes/expedientes.service';

/* =========================================================
   ESPURGO DOCUMENTAL - REQ-ESP-003
========================================================= */

import {
  EspurgoController,
} from './espurgo/espurgo.controller';

import {
  EspurgoService,
} from './espurgo/espurgo.service';

/* =========================================================
   INMUTABILIDAD EN BD (REQ-EXP-002.2)
========================================================= */

import { APP_FILTER } from '@nestjs/core';
import { DbIntegrityService } from './db-integrity';
import { DbIntegrityExceptionFilter } from './db-integrity.filter';

import { MailService } from './mail.service';

/* =========================================================
   CONTROLADORES
========================================================= */

import {
  AuditController,
  AuthController,
  CorrespondenceController,
  FormsController,
  InstitutionalCorrespondenceController,
  NewsController,
  ProcedureController,
  RepositoryController,
  UsersController,
} from './controllers';

/* =========================================================
   ENTIDADES TYPEORM
========================================================= */

const entities = [
  Role,
  User,

  /* ASIGNACIONES */
  Correspondence,
  CorrespondenceAttachment,
  CorrespondenceComment,

  /* CORRESPONDENCIA INSTITUCIONAL */
  InstitutionalCorrespondence,
  InstitutionalCorrespondenceAttachment,

  /* CARPETAS INSTITUCIONALES */
  Folder,

  RepositoryDocument,

  /* EXPEDIENTES */
  Expediente,

  Procedure,
  ProcedureStep,

  InstitutionalForm,

  ExternalLink,

  News,

  AuditLog,

  EspurgoRequest,
];

/* =========================================================
   APP MODULE
========================================================= */

@Module({
  imports: [
    /* CONFIG */
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    /* DATABASE */
    TypeOrmModule.forRootAsync({
      inject: [
        ConfigService,
      ],

      useFactory: (
        config:
          ConfigService,
      ) => ({
        type:
          'postgres',

        host:
          config.get<string>(
            'DB_HOST',
            'localhost',
          ),

        port:
          Number(
            config.get(
              'DB_PORT',
              5432,
            ),
          ),

        username:
          config.get<string>(
            'DB_USER',
            'sgip',
          ),

        password:
          config.get<string>(
            'DB_PASSWORD',
            'sgip',
          ),

        database:
          config.get<string>(
            'DB_NAME',
            'sgip',
          ),

        entities,

        /*
         * Solo desarrollo.
         *
         * Posteriormente:
         * synchronize: false
         * + migraciones.
         */
        synchronize: true,

        /*
         * Sesión en UTC: now() guarda UTC, igual que los
         * Date que escribe la app (ver pg-utc.ts).
         */
        extra: {
          options: POSTGRES_UTC_SESSION,
        },
      }),
    }),

    TypeOrmModule.forFeature(
      entities,
    ),

    /* JWT */
    JwtModule.registerAsync({
      inject: [
        ConfigService,
      ],

      useFactory: (
        config:
          ConfigService,
      ) => ({
        secret:
          config.get<string>(
            'JWT_SECRET',
            'dev-secret',
          ),

        signOptions: {
          expiresIn:
            '8h',
        },
      }),
    }),
  ],

  controllers: [
    AuthController,
    UsersController,

    /* ASIGNACIONES */
    CorrespondenceController,

    /* CORRESPONDENCIA INSTITUCIONAL */
    InstitutionalCorrespondenceController,

    /* CARPETAS INSTITUCIONALES */
    FoldersController,

    RepositoryController,
    ProcedureController,
    FormsController,
    LinksController,
    ExpedientesController,
    NewsController,
    AuditController,
    EspurgoController,
  ],

  providers: [
    /* INMUTABILIDAD (triggers SG403 y su traducción a 403) */
    DbIntegrityService,
    { provide: APP_FILTER, useClass: DbIntegrityExceptionFilter },

    /* AUTH */
    AuthService,
    JwtAuthGuard,

    /* ROLES */
    RolesGuard,

    /* SERVICES */
    AuditService,
    UsersService,

    /* ASIGNACIONES */
    CorrespondenceService,

    /* CORRESPONDENCIA INSTITUCIONAL */
    InstitutionalCorrespondenceService,

    /* CARPETAS INSTITUCIONALES */
    FoldersService,
    FolderImportService, // <-- Servicio de importación automática de carpetas

    RepositoryService,
    ProcedureService,
    FormsService,
    LinksService,
    ExpedientesService,
    MailService,
    NewsService,
    EspurgoService,
  ],
})
export class AppModule {}