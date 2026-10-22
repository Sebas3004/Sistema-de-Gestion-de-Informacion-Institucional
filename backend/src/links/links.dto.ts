import { PartialType } from '@nestjs/mapped-types';

import {
  Transform,
  Type,
} from 'class-transformer';

import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { LinkType } from '../entities';

/*
 * class-validator no recorta espacios; se recortan antes
 * de validar para que "   " no pase como nombre válido.
 */
const trim = () =>
  Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  );

/*
 * En filtros, "?type=" vacío equivale a no filtrar.
 */
const trimOrUndefined = () =>
  Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const clean = value.trim();

    return clean || undefined;
  });

/* =========================================================
   CREAR / EDITAR

   No se declaran id, active, createdBy, updatedBy ni
   fechas: con whitelist + forbidNonWhitelisted, enviarlos
   en el body produce 400.
========================================================= */

export class CreateLinkDto {
  @trim()
  @IsString()
  @IsNotEmpty({
    message: 'El nombre es obligatorio',
  })
  @MaxLength(180)
  name: string;

  @trim()
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
    },
    {
      message:
        'La URL debe ser válida y comenzar con http:// o https://',
    },
  )
  @MaxLength(2048)
  url: string;

  @trim()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @trim()
  @IsString()
  @IsNotEmpty({
    message: 'La categoría es obligatoria',
  })
  @MaxLength(80)
  category: string;

  @IsEnum(LinkType, {
    message: 'El tipo debe ser INTERNO o EXTERNO',
  })
  type: LinkType;

  @IsOptional()
  @IsBoolean()
  requiresInstitutionalNetwork?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(9999)
  sortOrder?: number;
}

export class UpdateLinkDto extends PartialType(
  CreateLinkDto,
) {}

/* =========================================================
   FILTROS DE CONSULTA
========================================================= */

export class ListLinksQueryDto {
  @trimOrUndefined()
  @IsOptional()
  @IsEnum(LinkType, {
    message: 'El tipo debe ser INTERNO o EXTERNO',
  })
  type?: LinkType;

  @trimOrUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @trimOrUndefined()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}
