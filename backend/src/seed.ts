import 'reflect-metadata';

import {
  hash,
} from 'bcrypt';

import {
  DataSource,
  Repository,
} from 'typeorm';

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
  RoleName,
  User,
} from './entities';

/* =========================================================
   DATA SOURCE
========================================================= */

const dataSource =
  new DataSource({
    type: 'postgres',

    host:
      process.env.DB_HOST ||
      'localhost',

    port:
      Number(
        process.env.DB_PORT ||
          5432,
      ),

    username:
      process.env.DB_USER ||
      'sgip',

    password:
      process.env.DB_PASSWORD ||
      'sgip',

    database:
      process.env.DB_NAME ||
      'sgip',

    entities: [
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
    ],

    synchronize: true,
  });

/* =========================================================
   CREAR / ACTUALIZAR ROL
========================================================= */

async function ensureRole(
  roleRepository:
    Repository<Role>,

  name: RoleName,

  description: string,
) {
  let role =
    await roleRepository
      .findOne({
        where: {
          name,
        },
      });

  if (!role) {
    role =
      roleRepository.create({
        name,
        description,
      });
  } else {
    role.description =
      description;
  }

  return roleRepository.save(
    role,
  );
}

/* =========================================================
   CREAR / ACTUALIZAR USUARIO
========================================================= */

async function ensureUser(
  userRepository:
    Repository<User>,

  roleRepository:
    Repository<Role>,

  data: {
    name: string;
    email: string;
    password: string;
    position: string;
    roleName: RoleName;
  },
) {
  const email =
    data.email
      .trim()
      .toLowerCase();

  let user =
    await userRepository
      .createQueryBuilder(
        'user',
      )
      .leftJoinAndSelect(
        'user.roles',
        'roles',
      )
      .where(
        'LOWER(user.email) = :email',
        {
          email,
        },
      )
      .getOne();

  const role =
    await roleRepository
      .findOne({
        where: {
          name:
            data.roleName,
        },
      });

  if (!role) {
    throw new Error(
      `No existe el rol ${data.roleName}`,
    );
  }

  const passwordHash =
    await hash(
      data.password,
      10,
    );

  /*
   * Si existe, lo actualizamos.
   *
   * Esto permite volver a ejecutar
   * el seed todas las veces que
   * necesitemos durante desarrollo.
   */
  if (user) {
    user.name =
      data.name;

    user.email =
      email;

    user.passwordHash =
      passwordHash;

    user.position =
      data.position;

    user.active =
      true;

    user.roles = [
      role,
    ];

    return userRepository
      .save(user);
  }

  user =
    userRepository.create({
      name:
        data.name,

      email,

      passwordHash,

      position:
        data.position,

      active: true,

      roles: [
        role,
      ],
    });

  return userRepository
    .save(user);
}

/* =========================================================
   SEED
========================================================= */

async function seed() {
  await dataSource.initialize();

  console.log(
    'Base de datos conectada',
  );

  /* =======================================================
     ROLES
  ======================================================= */

  const roleRepository =
    dataSource.getRepository(
      Role,
    );

  await ensureRole(
    roleRepository,
    RoleName.ADMIN,
    'Administrador del sistema',
  );

  await ensureRole(
    roleRepository,
    RoleName.EDITOR,
    'Editor de contenido institucional',
  );

  await ensureRole(
    roleRepository,
    RoleName.CONSULTOR,
    'Usuario de consulta',
  );

  /* =======================================================
     USUARIOS
  ======================================================= */

  const userRepository =
    dataSource.getRepository(
      User,
    );

  const admin =
    await ensureUser(
      userRepository,
      roleRepository,
      {
        name:
          'Keylor Herrera',

        email:
          'admin@itcr.ac.cr',

        password:
          'Admin123!',

        position:
          'Administrador',

        roleName:
          RoleName.ADMIN,
      },
    );

  const editor =
    await ensureUser(
      userRepository,
      roleRepository,
      {
        name:
          'Ana Torres',

        email:
          'editor@itcr.ac.cr',

        password:
          'Editor123!',

        position:
          'Editora institucional',

        roleName:
          RoleName.EDITOR,
      },
    );

  const consultor =
    await ensureUser(
      userRepository,
      roleRepository,
      {
        name:
          'Carlos Ruiz',

        email:
          'consultor@itcr.ac.cr',

        password:
          'Consultor123!',

        position:
          'Consultor',

        roleName:
          RoleName.CONSULTOR,
      },
    );

  console.log(
    'Usuarios creados/actualizados:',
  );

  console.log(
    `ADMIN: ${admin.email}`,
  );

  console.log(
    `EDITOR: ${editor.email}`,
  );

  console.log(
    `CONSULTOR: ${consultor.email}`,
  );

  /* =======================================================
     ENLACES
  ======================================================= */

  const linkRepository =
    dataSource.getRepository(
      ExternalLink,
    );

  if (
    (await linkRepository.count()) ===
    0
  ) {
    await linkRepository.save(
      [
        {
          name:
            'Sistema de solicitudes',

          url:
            'https://www.tec.ac.cr/',

          description:
            'Solicitudes institucionales',

          category:
            'Administrativo',
        },

        {
          name:
            'SICOP',

          url:
            'https://www.sicop.go.cr/',

          description:
            'Compras públicas',

          category:
            'Compras',
        },

        {
          name:
            'Correo institucional',

          url:
            'https://outlook.office.com/',

          description:
            'Correo TEC',

          category:
            'Comunicación',
        },

        {
          name:
            'SharePoint',

          url:
            'https://www.microsoft.com/microsoft-365/sharepoint/collaboration',

          description:
            'Documentos y colaboración',

          category:
            'Comunicación',
        },

        {
          name:
            'TEC Digital',

          url:
            'https://tecdigital.tec.ac.cr/',

          description:
            'Servicios académicos',

          category:
            'Académico',
        },

        {
          name:
            'Biblioteca',

          url:
            'https://www.tec.ac.cr/biblioteca',

          description:
            'Recursos de biblioteca',

          category:
            'Académico',
        },
      ] as any,
    );
  }

  /* =======================================================
     PROCEDIMIENTO
  ======================================================= */

  const procedureRepository =
    dataSource.getRepository(
      Procedure,
    );

  if (
    (await procedureRepository.count()) ===
    0
  ) {
    const procedure =
      procedureRepository.create({
        code:
          'SG-PR-01',

        name:
          'Solicitud de transporte',

        description:
          'Proceso para solicitar transporte institucional.',

        category:
          'Servicios Generales',

        status:
          'Activo',

        responsibleArea:
          'Servicios Generales',

        requirements: [
          'Completar formulario',
          'Indicar fechas y destino',
          'Contar con aprobación de jefatura',
        ],

        steps: [
          {
            stepOrder: 1,

            title:
              'Completar formulario',

            description:
              'Descargar y completar el formulario.',
          },

          {
            stepOrder: 2,

            title:
              'Solicitar aprobación',

            description:
              'Obtener aprobación de la jefatura.',
          },

          {
            stepOrder: 3,

            title:
              'Enviar solicitud',

            description:
              'Remitir a Servicios Generales.',
          },
        ] as any,

        links: [
          {
            label:
              'Sistema de solicitudes',

            url:
              'https://www.tec.ac.cr/',
          },
        ],

        relatedForms: [
          {
            label:
              'Solicitud de transporte',
          },
        ],
      });

    await procedureRepository
      .save(procedure);
  }

  /* =======================================================
     REPOSITORIO
  ======================================================= */

  const repositoryDocumentRepository =
    dataSource.getRepository(
      RepositoryDocument,
    );

  if (
    (
      await repositoryDocumentRepository
        .count()
    ) === 0
  ) {
    await repositoryDocumentRepository
      .save(
        [
          {
            name:
              'Reglamento académico del TEC',

            type:
              'Reglamento',

            category:
              'Reglamentos',

            description:
              'Reglamento académico institucional',

            version:
              '1.0',

            status:
              'ACTIVO',

            responsible:
              editor,
          },

          {
            name:
              'Guía de matrícula',

            type:
              'Guía',

            category:
              'Guías',

            description:
              'Pasos y requisitos para matrícula',

            version:
              '1.0',

            status:
              'ACTIVO',

            responsible:
              editor,
          },
        ] as any,
      );
  }

  /* =======================================================
     FORMULARIOS
  ======================================================= */

  const formRepository =
    dataSource.getRepository(
      InstitutionalForm,
    );

  if (
    (await formRepository.count()) ===
    0
  ) {
    await formRepository.save(
      [
        {
          name:
            'Formulario de viáticos',

          description:
            'Solicitud de viáticos',

          category:
            'Finanzas',

          format:
            'PDF',

          createdBy:
            editor,

          updatedBy:
            editor,
        },

        {
          name:
            'Solicitud de transporte',

          description:
            'Solicitud de transporte institucional',

          category:
            'Servicios Generales',

          format:
            'PDF',

          createdBy:
            editor,

          updatedBy:
            editor,
        },
      ] as any,
    );
  }

  /* =======================================================
     NOTICIAS
  ======================================================= */

  const newsRepository =
    dataSource.getRepository(
      News,
    );

  if (
    (await newsRepository.count()) ===
    0
  ) {
    await newsRepository.save(
      [
        {
          title:
            'Actividad cultural en el campus',

          summary:
            'Actividad cultural para la comunidad.',

          content:
            'Información de ejemplo.',

          category:
            'Eventos',

          author:
            editor,

          published:
            true,
        },
      ] as any,
    );
  }

  /* =======================================================
     CORRESPONDENCIA
  ======================================================= */

  const correspondenceRepository =
    dataSource.getRepository(
      Correspondence,
    );

  if (
    (
      await correspondenceRepository
        .count()
    ) === 0
  ) {
    const correspondence =
      correspondenceRepository
        .create({
          code:
            'COR-2026-001',

          subject:
            'Revisión Convenio Alianza Francesa',

          description:
            'Revisar documentos adjuntos y emitir observaciones.',

          type:
            'Comunicación externa',

          priority:
            'MEDIA',

          status:
            'EN_REVISION' as any,

          sender:
            admin,

          responsible:
            editor,

          participants: [
            admin,
            editor,
          ],

          dueDate:
            new Date(
              Date.now() +
                7 *
                  24 *
                  60 *
                  60 *
                  1000,
            ),
        });

    await correspondenceRepository
      .save(
        correspondence,
      );
  }

  console.log(
    'Seed completado correctamente',
  );

  await dataSource.destroy();
}

/* =========================================================
   EJECUCIÓN
========================================================= */

seed().catch(
  async (error) => {
    console.error(
      'Error ejecutando seed:',
      error,
    );

    if (
      dataSource
        .isInitialized
    ) {
      await dataSource.destroy();
    }

    process.exit(1);
  },
);