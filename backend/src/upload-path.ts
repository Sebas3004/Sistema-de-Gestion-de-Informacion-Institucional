import { BadRequestException } from '@nestjs/common';
import { basename, resolve, sep } from 'path';

export function getUploadDir(): string {
  return resolve(process.env.UPLOAD_DIR || './uploads');
}

/**
 * Devuelve la ruta absoluta de un archivo subido, garantizando
 * que quede dentro de la carpeta de uploads.
 */
export function resolveUploadPath(storedName: string): string {
  const directory = getUploadDir();
  const filePath = resolve(directory, basename(String(storedName ?? '')));

  if (!storedName || !filePath.startsWith(directory + sep)) {
    throw new BadRequestException('Ruta de archivo inválida');
  }

  return filePath;
}