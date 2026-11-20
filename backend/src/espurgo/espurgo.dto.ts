import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/* =========================================================
   CREAR SOLICITUD DE ESPURGO
========================================================= */

export class CreateEspurgoRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  unitName:
    string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  justification:
    string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(
    '4',
    {
      each: true,
    },
  )
  documentIds:
    string[];
}

/* =========================================================
   REVISIÓN CISET
========================================================= */

export class CisetReviewDto {
  @IsBoolean()
  approved:
    boolean;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  notes?:
    string;
}

/* =========================================================
   APROBACIÓN DE DIRECCIÓN
========================================================= */

export class DirectorDecisionDto {
  @IsBoolean()
  approved:
    boolean;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  directorName:
    string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  notes?:
    string;
}