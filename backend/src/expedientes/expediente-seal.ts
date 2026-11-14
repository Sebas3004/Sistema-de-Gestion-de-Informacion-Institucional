import { EntityManager } from 'typeorm';

import {
  Expediente,
  RepositoryDocument,
} from '../entities';

import { sha256Text } from '../file-hash';

/* =========================================================
   SELLO DE INTEGRIDAD DEL EXPEDIENTE (REQ-EXP-002.3)

   sealHash = SHA-256(canonicalJson(manifiesto)).

   El manifiesto se construye SIEMPRE con sealFromData: al
   cerrar, con los valores que se escriben en el mismo
   UPDATE (REQ-EXP-002.2: el trigger no permite tocar un
   expediente ya CERRADO); al verificar y al descargarlo,
   con lo leído de la BD (buildManifest). El sello es
   reproducible: si cambia cualquier dato cubierto, cambia
   el hash.

   Si algún día cambia la estructura o el algoritmo, se
   incrementa SEAL_VERSION y se conserva el constructor
   anterior para verificar los sellos viejos.
========================================================= */

export const SEAL_VERSION = 1;

export type ManifestDocument = {
  folio: number;
  id: string;
  originalName: string | null;
  size: number | null;
  mimeType: string | null;
  hash: string | null;
};

export type ExpedienteManifest = {
  sealVersion: number;
  id: string;
  code: string;
  name: string;
  closeReason: string | null;
  closedAt: string;
  closedBy: { id: string | null };
  documents: ManifestDocument[];
};

/* Datos del expediente que cubre el sello */
export type ManifestSource = {
  id: string;
  code: string;
  name: string;
  closeReason: string | null;
  closedAt: Date;
  closedById: string | null;
};

export type SealResult = {
  manifest: ExpedienteManifest;
  json: string;
  sealHash: string;
};

/*
 * JSON canónico: claves de objeto ordenadas de forma
 * recursiva, sin espacios; los arreglos conservan su orden.
 * Las propiedades undefined se omiten (como JSON.stringify).
 */
export function canonicalJson(value: unknown): string {
  if (value === null || value === undefined) {
    return 'null';
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;

    const entries = Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`);

    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
}

/*
 * Función pura: manifiesto y sello a partir de los datos
 * del expediente y de sus documentos, que deben venir
 * ordenados por folio. Es el único constructor: lo usan
 * el cierre y buildManifest, así producen los mismos bytes.
 */
export function sealFromData(
  source: ManifestSource,
  documents: RepositoryDocument[],
): SealResult {
  const manifest: ExpedienteManifest = {
    sealVersion: SEAL_VERSION,
    id: source.id,
    code: source.code,
    name: source.name,
    closeReason: source.closeReason ?? null,
    /* ISO 8601 en UTC (pg-utc.ts garantiza la lectura en UTC) */
    closedAt: new Date(source.closedAt).toISOString(),
    closedBy: { id: source.closedById ?? null },
    documents: documents.map((document) => ({
      folio: document.folio,
      id: document.id,
      originalName: document.originalName ?? null,
      /* bigint llega como string desde pg */
      size:
        document.size === null || document.size === undefined
          ? null
          : Number(document.size),
      mimeType: document.mimeType ?? null,
      hash: document.hash ?? null,
    })),
  };

  const json = canonicalJson(manifest);

  return {
    manifest,
    json,
    sealHash: sha256Text(json),
  };
}

/*
 * Construye el manifiesto desde la BD. Requiere que el
 * expediente esté cerrado (closedAt no nulo).
 */
export async function buildManifest(
  manager: EntityManager,
  id: string,
): Promise<SealResult> {
  const expediente = await manager.findOne(Expediente, {
    where: { id },
    relations: { closedBy: true },
  });

  if (!expediente?.closedAt) {
    throw new Error(
      `El expediente ${id} no está cerrado; no se puede construir su manifiesto`,
    );
  }

  const documents = await manager.find(RepositoryDocument, {
    where: { expediente: { id } },
    order: { folio: 'ASC' },
    loadEagerRelations: false,
  });

  return sealFromData(
    {
      id: expediente.id,
      code: expediente.code,
      name: expediente.name,
      closeReason: expediente.closeReason ?? null,
      closedAt: expediente.closedAt,
      closedById: expediente.closedBy?.id ?? null,
    },
    documents,
  );
}
