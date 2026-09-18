export const ROLES = {
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  CONSULTOR: 'CONSULTOR',
} as const;

export type Role =
  (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS = {
  ADMIN: 'Administrador',
  EDITOR: 'Editor',
  CONSULTOR: 'Consultor',
} as const;