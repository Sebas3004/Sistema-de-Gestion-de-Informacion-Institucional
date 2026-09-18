import React, { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import './styles.css';

import { AuthProvider, useAuth } from './auth';
import Layout from './layout';

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

function Guard({ children }: GuardProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

/* =========================================================
   APLICACIÓN / RUTAS
========================================================= */

function App() {
  return (
    <Routes>
      {/* LOGIN */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* RUTAS PROTEGIDAS */}
      <Route
        path="/"
        element={
          <Guard>
            <Layout />
          </Guard>
        }
      >
        {/* DASHBOARD */}
        <Route
          index
          element={<Dashboard />}
        />

        {/* CORRESPONDENCIA */}
        <Route
          path="correspondencia"
          element={<CorrespondenceList />}
        />

        <Route
          path="correspondencia/nueva"
          element={<NewCorrespondence />}
        />

        <Route
          path="correspondencia/:id"
          element={<CorrespondenceDetail />}
        />

        {/* REPOSITORIO */}
        <Route
          path="repositorio"
          element={<Repository />}
        />

        {/* PROCEDIMIENTOS */}
        <Route
          path="procedimientos"
          element={<Procedures />}
        />

        <Route
          path="procedimientos/:id"
          element={<ProcedureDetail />}
        />

        {/* FORMULARIOS */}
        <Route
          path="formularios"
          element={<Forms />}
        />

        {/* ENLACES */}
        <Route
          path="enlaces"
          element={<Links />}
        />

        {/* NOTICIAS */}
        <Route
          path="noticias"
          element={<News />}
        />

        {/* USUARIOS */}
        <Route
          path="usuarios"
          element={<Users />}
        />

        {/* HISTORIAL */}
        <Route
          path="historial"
          element={<Audit />}
        />
      </Route>

      {/* RUTA NO ENCONTRADA */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}

/* =========================================================
   RENDER PRINCIPAL
========================================================= */

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'No se encontró el elemento #root en index.html'
  );
}

createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);