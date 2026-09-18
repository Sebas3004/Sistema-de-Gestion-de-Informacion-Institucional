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

/* =========================================================
   ENTIDADES
========================================================= */

import {
  AuditLog,
  Correspondence,
  CorrespondenceAttachment,
  CorrespondenceComment,
  ExternalLink,
  InstitutionalForm,
  News,
  Procedure,
  ProcedureStep,
  RepositoryDocument,
  Role,
  User,
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
  LinksService,
  NewsService,
  ProcedureService,
  RepositoryService,
  UsersService,
} from './services';

/* =========================================================
   CONTROLADORES
========================================================= */

import {
  AuditController,
  AuthController,
  CorrespondenceController,
  FormsController,
  LinksController,
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

  Correspondence,
  CorrespondenceAttachment,
  CorrespondenceComment,

  RepositoryDocument,

  Procedure,
  ProcedureStep,

  InstitutionalForm,

  ExternalLink,

  News,

  AuditLog,
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
    CorrespondenceController,
    RepositoryController,
    ProcedureController,
    FormsController,
    LinksController,
    NewsController,
    AuditController,
  ],

  providers: [
    /* AUTH */
    AuthService,
    JwtAuthGuard,

    /* ROLES */
    RolesGuard,

    /* SERVICES */
    AuditService,
    UsersService,
    CorrespondenceService,
    RepositoryService,
    ProcedureService,
    FormsService,
    LinksService,
    NewsService,
  ],
})
export class AppModule {}