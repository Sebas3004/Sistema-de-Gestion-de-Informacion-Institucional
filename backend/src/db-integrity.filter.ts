import {
  ArgumentsHost,
  Catch,
  ForbiddenException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';

import { INTEGRITY_SQLSTATE } from './db-integrity';

/* =========================================================
   SG403 -> HTTP 403 (REQ-EXP-002.2)

   Cuando un trigger de inmutabilidad rechaza la operación,
   responde 403 con el mensaje del trigger, con la misma
   forma que cualquier ForbiddenException de Nest:
   { statusCode: 403, message, error: 'Forbidden' }.

   Cualquier otro error (otro SQLSTATE u otro tipo) sigue
   por BaseExceptionFilter, igual que antes. Se registra con
   APP_FILTER para que Nest le inyecte el HttpAdapterHost.
========================================================= */

@Catch(QueryFailedError)
export class DbIntegrityExceptionFilter extends BaseExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const driverError = (exception as any).driverError;

    if (driverError?.code === INTEGRITY_SQLSTATE) {
      return super.catch(
        new ForbiddenException(driverError.message || exception.message),
        host,
      );
    }

    return super.catch(exception, host);
  }
}
