import { ReactNode } from 'react';
import {
  Navigate,
} from 'react-router-dom';

import { useAuth } from './auth';
import { hasAnyRole } from './permissions';

type RoleGuardProps = {
  roles: string[];
  children: ReactNode;
};

export default function RoleGuard({
  roles,
  children,
}: RoleGuardProps) {
  const { user } = useAuth();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const allowed =
    hasAnyRole(
      user,
      roles,
    );

  if (!allowed) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return <>{children}</>;
}