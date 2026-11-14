import { Transform } from 'class-transformer';

import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { ExpedienteStatus } from '../entities';

/*
 * Mismos helpers que links.dto.ts: class-validator no
 * recorta espacios, así que se recortan antes de validar.
 */
const trim = () =>
  Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  );

/*
 * En filtros, "?status=" vacío equivale a no filtrar.
 */
const trimOrUndefined = () =>
  Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const clean = value.trim();

    return clean || undefined;
  });

/*
 * folderId: "" o null significan "sin carpeta".
 */
const emptyToNull = () =>
  Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const clean = value.trim();

    return clean || null;
  });

/* =========================================================
   CREAR / EDITAR

   No se declaran code, status, nextFolio, createdBy,
   closedBy, closedAt ni closeReason: con whitelist +
   forbidNonWhitelisted, enviarlos en el body produce 400.
   El código lo genera el sistema (EXP-AAAA-NNNNN).
========================================================= */

export class CreateExpedienteDto {
  @trim()
  @IsString()
  @IsNotEmpty({
    message: 'El nombre es obligatorio',
  })
  @MaxLength(200)
  name: string;

  @trim()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @emptyToNull()
  @IsOptional()
  @IsUUID('all', {
    message: 'La carpeta no es válida',
  })
  folderId?: string | null;
}

/*
 * PATCH solo admite name, description y folderId.
 */
export class UpdateExpedienteDto {
  @trim()
  @IsOptional()
  @IsString()
  @IsNotEmpty({
    message: 'El nombre es obligatorio',
  })
  @MaxLength(200)
  name?: string;

  @trim()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @emptyToNull()
  @IsOptional()
  @IsUUID('all', {
    message: 'La carpeta no es válida',
  })
  folderId?: string | null;
}

/* =========================================================
   FOLIADO Y CIERRE
========================================================= */

export class AddDocumentDto {
  @IsUUID('all', {
    message: 'El documento no es válido',
  })
  documentId: string;
}

export class CloseExpedienteDto {
  @trim()
  @IsString({
    message: 'Debe indicar el motivo del cierre',
  })
  @MinLength(10, {
    message: 'El motivo del cierre debe tener al menos 10 caracteres',
  })
  @MaxLength(2000)
  reason: string;
}

/* =========================================================
   FILTROS DE CONSULTA
========================================================= */

export class ListExpedientesQueryDto {
  @trimOrUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @trimOrUndefined()
  @IsOptional()
  @IsEnum(ExpedienteStatus, {
    message: 'El estado debe ser ABIERTO o CERRADO',
  })
  status?: ExpedienteStatus;

  @trimOrUndefined()
  @IsOptional()
  @IsUUID('all', {
    message: 'La carpeta no es válida',
  })
  folderId?: string;
}
