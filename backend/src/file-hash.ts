import { createHash } from 'crypto';
import { createReadStream } from 'fs';

import { resolveUploadPath } from './upload-path';

/* =========================================================
   HASH DE ARCHIVOS Y TEXTO (REQ-EXP-002.3)
========================================================= */

export const HASH_ALGORITHM = 'SHA-256';

/*
 * Error identificable para "el archivo físico no existe",
 * de modo que cada servicio decida el mensaje adecuado.
 */
export class MissingFileError extends Error {
  constructor(readonly storedName: string) {
    super(`El archivo ${storedName} no existe`);
  }
}

/*
 * SHA-256 en hexadecimal de un archivo de UPLOAD_DIR,
 * leído en streaming (no carga el archivo en memoria).
 */
export function sha256File(storedName: string): Promise<string> {
  const filePath = resolveUploadPath(storedName);

  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);

    stream.on('error', (error: NodeJS.ErrnoException) =>
      reject(
        error.code === 'ENOENT' || error.code === 'EISDIR'
          ? new MissingFileError(storedName)
          : error,
      ),
    );

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

export function sha256Text(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}
