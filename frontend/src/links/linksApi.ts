import { api } from '../api';

/* =========================================================
   TIPOS
========================================================= */

export type LinkType = 'INTERNO' | 'EXTERNO';

export type QuickLink = {
  id: string;
  name: string;
  url: string;
  description?: string | null;
  category: string;
  type: LinkType;
  requiresInstitutionalNetwork: boolean;
  sortOrder: number;
  active: boolean;
  createdBy?: { name?: string } | null;
  updatedBy?: { name?: string } | null;
  createdAt?: string;
  updatedAt?: string;
};

export type LinkInput = {
  name: string;
  url: string;
  description?: string;
  category: string;
  type: LinkType;
  requiresInstitutionalNetwork: boolean;
};

/* =========================================================
   LLAMADAS A LA API
========================================================= */

export const linksApi = {
  /* Solo activos (todos los roles) */
  list: () =>
    api.get<QuickLink[]>('/links').then((r) => r.data),

  /* Incluye inactivos (ADMIN / EDITOR) */
  listAll: () =>
    api.get<QuickLink[]>('/links/manage').then((r) => r.data),

  create: (data: LinkInput) =>
    api.post<QuickLink>('/links', data).then((r) => r.data),

  update: (id: string, data: Partial<LinkInput>) =>
    api.patch<QuickLink>(`/links/${id}`, data).then((r) => r.data),

  /* Solo ADMIN */
  deactivate: (id: string) =>
    api.patch<QuickLink>(`/links/${id}/deactivate`).then((r) => r.data),

  /* Solo ADMIN */
  restore: (id: string) =>
    api.patch<QuickLink>(`/links/${id}/restore`).then((r) => r.data),
};

/* =========================================================
   HELPERS
========================================================= */

/*
 * Nest devuelve message como string o, en errores de
 * validación, como string[] (uno por campo).
 */
export function linkErrorMessage(
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
 * El href solo se renderiza para http(s); cualquier otro
 * esquema (javascript:, data:, ...) se descarta.
 */
export function isSafeUrl(value?: string | null): boolean {
  return /^https?:\/\//i.test(String(value ?? '').trim());
}
