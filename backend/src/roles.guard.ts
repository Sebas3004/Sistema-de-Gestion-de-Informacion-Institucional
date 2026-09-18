import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import {
  Reflector,
} from '@nestjs/core';

import {
  ROLES_KEY,
} from './roles.decorator';

import {
  Role,
} from './roles';

@Injectable()
export class RolesGuard
  implements CanActivate
{
  constructor(
    private readonly reflector:
      Reflector,
  ) {}

  canActivate(
    context:
      ExecutionContext,
  ): boolean {
    const requiredRoles =
      this.reflector
        .getAllAndOverride<
          Role[]
        >(
          ROLES_KEY,
          [
            context.getHandler(),
            context.getClass(),
          ],
        );

    /*
     * No hay @Roles()
     * = no hay restricción adicional.
     */
    if (
      !requiredRoles ||
      requiredRoles.length ===
        0
    ) {
      return true;
    }

    const request =
      context
        .switchToHttp()
        .getRequest();

    const user =
      request.user;

    if (!user) {
      throw new ForbiddenException(
        'Usuario no autenticado',
      );
    }

    const userRoles:
      string[] =
        (
          user.roles ?? []
        ).map(
          (
            role:
              | string
              | {
                  name?: string;
                },
          ) => {
            if (
              typeof role ===
              'string'
            ) {
              return role;
            }

            return (
              role.name ?? ''
            );
          },
        );

    const allowed =
      requiredRoles.some(
        (role) =>
          userRoles.includes(
            role,
          ),
      );

    if (!allowed) {
      throw new ForbiddenException(
        'No tiene permisos para realizar esta acción',
      );
    }

    return true;
  }
}