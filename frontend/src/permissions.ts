import {
  ROLES,
} from './roles';

/* =========================================================
   TIPOS
========================================================= */

export type UserLike =
  | {
      roles?: string[];
    }
  | null
  | undefined;

/* =========================================================
   HELPERS BÁSICOS DE ROLES
========================================================= */

export function hasRole(
  user: UserLike,
  role: string,
): boolean {
  return (
    user?.roles?.includes(role) ??
    false
  );
}

export function hasAnyRole(
  user: UserLike,
  roles: string[],
): boolean {
  return roles.some(
    (role) =>
      hasRole(
        user,
        role,
      ),
  );
}

/* =========================================================
   IDENTIFICACIÓN DE ROL
========================================================= */

export function isAdmin(
  user: UserLike,
): boolean {
  return hasRole(
    user,
    ROLES.ADMIN,
  );
}

export function isEditor(
  user: UserLike,
): boolean {
  return hasRole(
    user,
    ROLES.EDITOR,
  );
}

export function isConsultor(
  user: UserLike,
): boolean {
  return hasRole(
    user,
    ROLES.CONSULTOR,
  );
}

/* =========================================================
   PERMISOS GENERALES
========================================================= */

export function canManageContent(
  user: UserLike,
): boolean {
  return (
    isAdmin(user) ||
    isEditor(user)
  );
}

export function canCreateContent(
  user: UserLike,
): boolean {
  return canManageContent(
    user,
  );
}

export function canEditContent(
  user: UserLike,
): boolean {
  return canManageContent(
    user,
  );
}

export function canDeleteContent(
  user: UserLike,
): boolean {
  return isAdmin(
    user,
  );
}

/* =========================================================
   USUARIOS
========================================================= */

export function canViewUsers(
  user: UserLike,
): boolean {
  return isAdmin(
    user,
  );
}

export function canManageUsers(
  user: UserLike,
): boolean {
  return isAdmin(
    user,
  );
}

/* =========================================================
   HISTORIAL
========================================================= */

export function canViewOwnAudit(
  user: UserLike,
): boolean {
  return hasAnyRole(
    user,
    [
      ROLES.ADMIN,
      ROLES.EDITOR,
      ROLES.CONSULTOR,
    ],
  );
}

export function canViewGlobalAudit(
  user: UserLike,
): boolean {
  return isAdmin(
    user,
  );
}

/* =========================================================
   CORRESPONDENCIA
========================================================= */

export function canViewCorrespondence(
  user: UserLike,
): boolean {
  return hasAnyRole(
    user,
    [
      ROLES.ADMIN,
      ROLES.EDITOR,
    ],
  );
}

export function canCreateCorrespondence(
  user: UserLike,
): boolean {
  return hasAnyRole(
    user,
    [
      ROLES.ADMIN,
      ROLES.EDITOR,
    ],
  );
}

export function canEditCorrespondence(
  user: UserLike,
): boolean {
  return hasAnyRole(
    user,
    [
      ROLES.ADMIN,
      ROLES.EDITOR,
    ],
  );
}

export function canCommentCorrespondence(
  user: UserLike,
): boolean {
  return hasAnyRole(
    user,
    [
      ROLES.ADMIN,
      ROLES.EDITOR,
    ],
  );
}

export function canUploadCorrespondenceFiles(
  user: UserLike,
): boolean {
  return hasAnyRole(
    user,
    [
      ROLES.ADMIN,
      ROLES.EDITOR,
    ],
  );
}

export function canManageCorrespondence(
  user: UserLike,
): boolean {
  return hasAnyRole(
    user,
    [
      ROLES.ADMIN,
      ROLES.EDITOR,
    ],
  );
}

/* =========================================================
   REPOSITORIO
========================================================= */

export function canViewRepository(
  user: UserLike,
): boolean {
  return hasAnyRole(
    user,
    [
      ROLES.ADMIN,
      ROLES.EDITOR,
      ROLES.CONSULTOR,
    ],
  );
}

export function canDownloadRepository(
  user: UserLike,
): boolean {
  return canViewRepository(
    user,
  );
}

export function canCreateRepositoryDocument(
  user: UserLike,
): boolean {
  return canManageContent(
    user,
  );
}

export function canEditRepositoryDocument(
  user: UserLike,
): boolean {
  return canManageContent(
    user,
  );
}

export function canDeleteRepositoryDocument(
  user: UserLike,
): boolean {
  return isAdmin(
    user,
  );
}

export function canManageRepository(
  user: UserLike,
): boolean {
  return canManageContent(
    user,
  );
}

/* =========================================================
   PROCEDIMIENTOS
========================================================= */

export function canViewProcedures(
  user: UserLike,
): boolean {
  return hasAnyRole(
    user,
    [
      ROLES.ADMIN,
      ROLES.EDITOR,
      ROLES.CONSULTOR,
    ],
  );
}

export function canCreateProcedures(
  user: UserLike,
): boolean {
  return canManageContent(
    user,
  );
}

export function canEditProcedures(
  user: UserLike,
): boolean {
  return canManageContent(
    user,
  );
}

export function canDeleteProcedures(
  user: UserLike,
): boolean {
  return isAdmin(
    user,
  );
}

export function canManageProcedures(
  user: UserLike,
): boolean {
  return canManageContent(
    user,
  );
}

/* =========================================================
   FORMULARIOS
========================================================= */

export function canViewForms(
  user: UserLike,
): boolean {
  return hasAnyRole(
    user,
    [
      ROLES.ADMIN,
      ROLES.EDITOR,
      ROLES.CONSULTOR,
    ],
  );
}

export function canDownloadForms(
  user: UserLike,
): boolean {
  return canViewForms(
    user,
  );
}

export function canCreateForms(
  user: UserLike,
): boolean {
  return canManageContent(
    user,
  );
}

export function canEditForms(
  user: UserLike,
): boolean {
  return canManageContent(
    user,
  );
}

export function canDeleteForms(
  user: UserLike,
): boolean {
  return isAdmin(
    user,
  );
}

export function canManageForms(
  user: UserLike,
): boolean {
  return canManageContent(
    user,
  );
}

/* =========================================================
   ENLACES
========================================================= */

export function canViewLinks(
  user: UserLike,
): boolean {
  return hasAnyRole(
    user,
    [
      ROLES.ADMIN,
      ROLES.EDITOR,
      ROLES.CONSULTOR,
    ],
  );
}

export function canManageLinks(
  user: UserLike,
): boolean {
  return canManageContent(
    user,
  );
}

/* =========================================================
   NOTICIAS
========================================================= */

export function canViewNews(
  user: UserLike,
): boolean {
  return hasAnyRole(
    user,
    [
      ROLES.ADMIN,
      ROLES.EDITOR,
      ROLES.CONSULTOR,
    ],
  );
}

export function canCreateNews(
  user: UserLike,
): boolean {
  return canManageContent(
    user,
  );
}

export function canEditNews(
  user: UserLike,
): boolean {
  return canManageContent(
    user,
  );
}

export function canDeleteNews(
  user: UserLike,
): boolean {
  return isAdmin(
    user,
  );
}

export function canManageNews(
  user: UserLike,
): boolean {
  return canManageContent(
    user,
  );
}