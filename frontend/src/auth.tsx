import React, { createContext, useContext, useState } from 'react';
import { api } from './api';

type U = {
  id: string;
  name: string;
  email: string;
  position?: string;
  roles: string[];
  mustChangePassword?: boolean;
};

const C = createContext<any>(null);

export const useAuth = () =>
  useContext(C);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] =
    useState<U | null>(() =>
      JSON.parse(
        localStorage.getItem(
          'user',
        ) || 'null',
      ),
    );

  const login = async (
    email: string,
    password: string,
  ) => {
    const { data } =
      await api.post(
        '/auth/login',
        {
          email,
          password,
        },
      );

    localStorage.setItem(
      'token',
      data.accessToken,
    );

    localStorage.setItem(
      'user',
      JSON.stringify(
        data.user,
      ),
    );

    setUser(data.user);

    return data.user as U;
  };

  const completePasswordChange =
    () => {
      setUser((current) => {
        if (!current) {
          return current;
        }

        const updated = {
          ...current,
          mustChangePassword:
            false,
        };

        localStorage.setItem(
          'user',
          JSON.stringify(
            updated,
          ),
        );

        return updated;
      });
    };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <C.Provider
      value={{
        user,
        login,
        logout,
        completePasswordChange,
      }}
    >
      {children}
    </C.Provider>
  );
}
