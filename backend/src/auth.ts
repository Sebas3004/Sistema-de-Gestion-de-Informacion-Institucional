import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  JwtService,
} from '@nestjs/jwt';

import {
  compare,
} from 'bcrypt';

import {
  Repository,
} from 'typeorm';

import {
  User,
} from './entities';

/* =========================================================
   AUTH SERVICE
========================================================= */

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,

    private readonly jwt: JwtService,
  ) {}

  /* =======================================================
     LOGIN
  ======================================================= */

  async login(
    email: string,
    password: string,
  ) {
    if (
      !email?.trim() ||
      !password
    ) {
      throw new UnauthorizedException(
        'Credenciales inválidas',
      );
    }

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    /*
     * passwordHash normalmente está oculto
     * mediante select:false en la entidad.
     *
     * Por eso utilizamos addSelect().
     */
    const user =
      await this.users
        .createQueryBuilder('user')
        .addSelect(
          'user.passwordHash',
        )
        .leftJoinAndSelect(
          'user.roles',
          'roles',
        )
        .where(
          'LOWER(user.email) = :email',
          {
            email:
              normalizedEmail,
          },
        )
        .getOne();

    if (
      !user ||
      !user.active
    ) {
      throw new UnauthorizedException(
        'Credenciales inválidas',
      );
    }

    const validPassword =
      await compare(
        password,
        user.passwordHash,
      );

    if (!validPassword) {
      throw new UnauthorizedException(
        'Credenciales inválidas',
      );
    }

    const roles =
      user.roles?.map(
        (role) =>
          role.name,
      ) ?? [];

    /*
     * Información que queda almacenada
     * dentro del JWT.
     *
     * request.user tendrá estos datos
     * después de validar el token.
     */
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      position: user.position,
      roles,
    };

    const accessToken =
      await this.jwt.signAsync(
        payload,
      );

    /*
     * Información que recibe React
     * después del login.
     */
    return {
      accessToken,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        position:
          user.position,
        roles,
      },
    };
  }
}

/* =========================================================
   JWT AUTH GUARD
========================================================= */

@Injectable()
export class JwtAuthGuard
  implements CanActivate
{
  constructor(
    private readonly jwt: JwtService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context
        .switchToHttp()
        .getRequest();

    const authorization =
      request.headers
        .authorization ?? '';

    /*
     * Debe venir:
     *
     * Authorization: Bearer TOKEN
     */
    const match =
      authorization.match(
        /^Bearer\s+(.+)$/i,
      );

    if (!match) {
      throw new UnauthorizedException(
        'Token requerido',
      );
    }

    const token =
      match[1];

    try {
      const payload =
        await this.jwt.verifyAsync(
          token,
        );

      /*
       * Esto es lo que posteriormente
       * leen RolesGuard y los servicios.
       */
      request.user =
        payload;

      return true;
    } catch {
      throw new UnauthorizedException(
        'Token inválido o expirado',
      );
    }
  }
}