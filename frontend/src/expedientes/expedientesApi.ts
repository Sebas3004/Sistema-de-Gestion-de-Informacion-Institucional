import { api } from '../api';

/* =========================================================
   TIPOS
========================================================= */

export type ExpedienteStatus = 'ABIERTO' | 'CERRADO';

type UserRef = { id?: string; name?: string } | null;

type FolderRef = { id: string; name: string; code?: string | null } | null;

export type Expediente = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  folder?: FolderRef;
  status: ExpedienteStatus;
  createdBy?: UserRef;
  closedBy?: UserRef;
  closedAt?: string | null;
  closeReason?: string | null;
  sealHash?: string | null;
  sealedAt?: string | null;
  sealVersion?: number | null;
  nextFolio: number;
  documentCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ExpedienteDocument = {
  id: string;
  name: string;
  type?: string;
  category?: string;
  version?: string | null;
  status?: string;
  originalName?: string | null;
  folio: number | null;
  hash?: string | null;
  hashAlgorithm?: string | null;
  folder?: FolderRef;
  responsible?: UserRef;
  expediente?: { id: string; code: string; status: ExpedienteStatus } | null;
  createdAt?: string;
};

export type ExpedienteDetail = Expediente & {
  documents: ExpedienteDocument[];
};

/*
 * Solo los campos de los DTOs: el backend usa
 * forbidNonWhitelisted y rechaza cualquier otro
 * (code, status, nextFolio... los maneja el sistema).
 */
export type ExpedienteInput = {
  name: string;
  description?: string;
  folderId?: string | null;
};

/* Respuesta de GET /expedientes/:id/verify */
export type VerifyDocument = {
  folio: number | null;
  nombre: string;
  hashEsperado: string | null;
  hashActual: string | null;
  ok: boolean;
  motivo?: string;
};

export type VerifyResult = {
  integro: boolean;
  sealValido: boolean | null;
  sealHash?: string | null;
  sealVersion?: number | null;
  verificadoEn: string;
  motivo?: string;
  documentos: VerifyDocument[];
};

export type ExpedienteFilters = {
  search?: string;
  status?: ExpedienteStatus | '';
  folderId?: string;
};

/* =========================================================
   LLAMADAS A LA API
========================================================= */

/* "" o undefined no se envían como filtro */
const cleanParams = (filters: ExpedienteFilters = {}) =>
  Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && String(value).trim() !== '',
    ),
  );

export const expedientesApi = {
  /* Todos los roles */
  list: (filters?: ExpedienteFilters) =>
    api
      .get<Expediente[]>('/expedientes', { params: cleanParams(filters) })
      .then((r) => r.data),

  /* Todos los roles: incluye documentos ordenados por folio */
  get: (id: string) =>
    api.get<ExpedienteDetail>(`/expedientes/${id}`).then((r) => r.data),

  /* ADMIN / EDITOR */
  create: (data: ExpedienteInput) =>
    api.post<ExpedienteDetail>('/expedientes', data).then((r) => r.data),

  /* ADMIN / EDITOR */
  update: (id: string, data: Partial<ExpedienteInput>) =>
    api
      .patch<ExpedienteDetail>(`/expedientes/${id}`, data)
      .then((r) => r.data),

  /* ADMIN / EDITOR: asigna el siguiente folio */
  addDocument: (id: string, documentId: string) =>
    api
      .post<ExpedienteDetail>(`/expedientes/${id}/documents`, { documentId })
      .then((r) => r.data),

  /* Solo ADMIN */
  close: (id: string, reason: string) =>
    api
      .patch<ExpedienteDetail>(`/expedientes/${id}/close`, { reason })
      .then((r) => r.data),

  /* Todos los roles: recalcula hashes y sello (se audita) */
  verify: (id: string) =>
    api.get<VerifyResult>(`/expedientes/${id}/verify`).then((r) => r.data),

  /*
   * Todos los roles: descarga los bytes exactos del
   * manifiesto (su SHA-256 es el sello). Va por axios
   * porque el JWT viaja en un header, no en la URL.
   */
  downloadManifest: async (id: string, fileName: string) => {
    const response = await api.get(`/expedientes/${id}/manifest`, {
      responseType: 'blob',
    });

    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  },

  /* Documentos del repositorio (para elegir cuál foliar) */
  repositoryDocuments: () =>
    api.get<ExpedienteDocument[]>('/repository').then((r) => r.data),
};

/* =========================================================
   HELPERS
========================================================= */

/*
 * Nest devuelve message como string o, en errores de
 * validación, como string[] (uno por campo).
 */
export function expedienteErrorMessage(
  error: any,
  fallback: string,
): string {
  const message = error?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(' · ');
  }

  return message || fallback;
}

/*
 * Igual que expedienteErrorMessage, pero para respuestas
 * pedidas como blob (el cuerpo del error llega como Blob).
 */
export async function blobErrorMessage(
  error: any,
  fallback: string,
): Promise<string> {
  const data = error?.response?.data;

  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());

      return expedienteErrorMessage({ response: { data: parsed } }, fallback);
    } catch {
      return fallback;
    }
  }

  return expedienteErrorMessage(error, fallback);
}

/* a1b2c3d4…e5f6a7b8 */
export function shortHash(value?: string | null): string {
  if (!value) {
    return '-';
  }

  return value.length > 16
    ? `${value.slice(0, 8)}…${value.slice(-8)}`
    : value;
}

/*
 * Mismo formato que la tabla de Historial (pages.tsx):
 * es-CR en hora de Costa Rica, sin depender de la zona
 * horaria del navegador.
 */
export function formatDateTime(value?: string | null): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleString('es-CR', {
        timeZone: 'America/Costa_Rica',
      });
}
