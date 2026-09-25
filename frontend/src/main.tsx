import React, {
  ReactNode,
} from 'react';

import {
  createRoot,
} from 'react-dom/client';

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import './styles.css';

import {
  AuthProvider,
  useAuth,
} from './auth';

import Layout from './layout';
import RoleGuard from './RoleGuard';

import {
  ROLES,
} from './roles';

import {
  Audit,
  CorrespondenceDetail,
  CorrespondenceList,
  Dashboard,
  Forms,
  Links,
  Login,
  NewCorrespondence,
  News,
  NewProcedure,
  EditProcedure,
  ProcedureDetail,
  Procedures,
  Repository,
  Users,
} from './pages';

/* =========================================================
   GUARD DE AUTENTICACIÓN
========================================================= */

type GuardProps = {
  children: ReactNode;
};

function Guard({
  children,
}: GuardProps) {
  const { user } =
    useAuth();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <>{children}</>;
}

/* =========================================================
   APLICACIÓN
========================================================= */

function App() {
  return (
    <Routes>
      {/* LOGIN */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* ÁREA AUTENTICADA */}
      <Route
        path="/"
        element={
          <Guard>
            <Layout />
          </Guard>
        }
      >
        {/* INICIO */}
        <Route
          index
          element={<Dashboard />}
        />

        {/* =================================================
            CORRESPONDENCIA
            ADMIN + EDITOR
        ================================================= */}

        <Route
          path="correspondencia"
          element={
            <RoleGuard
              roles={[
                ROLES.ADMIN,
                ROLES.EDITOR,
              ]}
            >
              <CorrespondenceList />
            </RoleGuard>
          }
        />

        <Route
          path="correspondencia/nueva"
          element={
            <RoleGuard
              roles={[
                ROLES.ADMIN,
                ROLES.EDITOR,
              ]}
            >
              <NewCorrespondence />
            </RoleGuard>
          }
        />

        <Route
          path="correspondencia/:id"
          element={
            <RoleGuard
              roles={[
                ROLES.ADMIN,
                ROLES.EDITOR,
              ]}
            >
              <CorrespondenceDetail />
            </RoleGuard>
          }
        />

        {/* =================================================
            REPOSITORIO
            TODOS
        ================================================= */}

        <Route
          path="repositorio"
          element={
            <RoleGuard
              roles={[
                ROLES.ADMIN,
                ROLES.EDITOR,
                ROLES.CONSULTOR,
              ]}
            >
              <Repository />
            </RoleGuard>
          }
        />

        <Route
          path="repositorio/:id"
          element={
            <RoleGuard
              roles={[
                ROLES.ADMIN,
                ROLES.EDITOR,
                ROLES.CONSULTOR,
              ]}
            >
              <Repository />
            </RoleGuard>
          }
        />

        {/* =================================================
            PROCEDIMIENTOS
            TODOS
        ================================================= */}

        <Route
          path="procedimientos"
          element={
            <RoleGuard
              roles={[
                ROLES.ADMIN,
                ROLES.EDITOR,
                ROLES.CONSULTOR,
              ]}
            >
              <Procedures />
            </RoleGuard>
          }
        />

        <Route
          path="procedimientos/nuevo"
          element={
            <RoleGuard
              roles={[
                ROLES.ADMIN,
                ROLES.EDITOR,
              ]}
            >
              <NewProcedure />
            </RoleGuard>
          }
        />

        <Route
          path="procedimientos/:id/editar"
          element={
            <RoleGuard
              roles={[
                ROLES.ADMIN,
                ROLES.EDITOR,
              ]}
            >
              <EditProcedure />
            </RoleGuard>
          }
        />

        <Route
          path="procedimientos/:id"
          element={
            <RoleGuard
              roles={[
                ROLES.ADMIN,
                ROLES.EDITOR,
                ROLES.CONSULTOR,
              ]}
            >
              <ProcedureDetail />
            </RoleGuard>
          }
        />

        {/* =================================================
            FORMULARIOS
            TODOS
        ================================================= */}

        <Route
          path="formularios"
          element={
            <RoleGuard
              roles={[
                ROLES.ADMIN,
                ROLES.EDITOR,
                ROLES.CONSULTOR,
              ]}
            >
              <Forms />
            </RoleGuard>
          }
        />

        {/* =================================================
            ENLACES
            TODOS
        ================================================= */}

        <Route
          path="enlaces"
          element={
            <RoleGuard
              roles={[
                ROLES.ADMIN,
                ROLES.EDITOR,
                ROLES.CONSULTOR,
              ]}
            >
              <Links />
            </RoleGuard>
          }
        />

        {/* =================================================
            NOTICIAS
            TODOS
        ================================================= */}

        <Route
          path="noticias"
          element={
            <RoleGuard
              roles={[
                ROLES.ADMIN,
                ROLES.EDITOR,
                ROLES.CONSULTOR,
              ]}
            >
              <News />
            </RoleGuard>
          }
        />

        {/* =================================================
            USUARIOS
            SOLO ADMIN
        ================================================= */}

        <Route
          path="usuarios"
          element={
            <RoleGuard
              roles={[
                ROLES.ADMIN,
              ]}
            >
              <Users />
            </RoleGuard>
          }
        />

        {/* =================================================
            HISTORIAL
            TODOS - la pantalla decide si puede ver ALL
        ================================================= */}

        <Route
          path="historial"
          element={
            <RoleGuard
              roles={[
                ROLES.ADMIN,
                ROLES.EDITOR,
                ROLES.CONSULTOR,
              ]}
            >
              <Audit />
            </RoleGuard>
          }
        />
      </Route>

      {/* RUTA NO ENCONTRADA */}
      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}

/* =========================================================
   RENDER
========================================================= */

const rootElement =
  document.getElementById(
    'root',
  );

if (!rootElement) {
  throw new Error(
    'No se encontró #root en index.html',
  );
}

createRoot(
  rootElement,
).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);