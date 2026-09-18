import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';

import {
  BookOpen,
  ClipboardList,
  FileText,
  HelpCircle,
  History,
  Home,
  Info,
  Link2,
  LogOut,
  Mail,
  Menu,
  Newspaper,
  Search,
  Users,
} from 'lucide-react';

import { useState } from 'react';
import { useAuth } from './auth';

/* =========================================================
   LAYOUT PRINCIPAL
========================================================= */

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const admin =
    user?.roles?.includes('ADMIN') ?? false;

  const items = [
    {
      to: '/',
      label: 'Inicio',
      icon: Home,
      end: true,
    },
    {
      to: '/correspondencia',
      label: 'Correspondencia',
      icon: Mail,
    },
    {
      to: '/repositorio',
      label: 'Repositorio',
      icon: FileText,
    },
    {
      to: '/procedimientos',
      label: 'Procedimientos',
      icon: ClipboardList,
    },
    {
      to: '/formularios',
      label: 'Formularios',
      icon: BookOpen,
    },
    {
      to: '/enlaces',
      label: 'Enlaces a sistemas',
      icon: Link2,
    },
    {
      to: '/noticias',
      label: 'Noticias',
      icon: Newspaper,
    },

    ...(admin
      ? [
          {
            to: '/usuarios',
            label: 'Usuarios',
            icon: Users,
          },
        ]
      : []),

    {
      to: '/historial',
      label: 'Historial',
      icon: History,
    },
  ];

  /* =======================================================
     CERRAR SESIÓN
  ======================================================= */

  const handleLogout = () => {
    logout();

    navigate('/login', {
      replace: true,
    });
  };

  /* =======================================================
     INICIALES DEL USUARIO
  ======================================================= */

  const initials =
    user?.name
      ?.split(' ')
      .filter(Boolean)
      .map((word: string) => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U';

  return (
    <div className="app">
      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside
        className={`app-sidebar ${
          sidebarOpen ? 'open' : ''
        }`}
      >
        {/* LOGO */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="sidebar-tec">
              TEC
            </span>

            <span className="sidebar-divider" />

            <span className="sidebar-brand-name">
              Tecnológico
              <br />
              de Costa Rica
            </span>
          </div>

          <p className="sidebar-campus">
            Campus Tecnológico de San José
          </p>
        </div>

        {/* MENÚ */}
        <nav className="sidebar-nav">
          {items.map(
            ({
              to,
              label,
              icon: Icon,
              end,
            }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `sidebar-link ${
                    isActive ? 'active' : ''
                  }`
                }
                onClick={() =>
                  setSidebarOpen(false)
                }
              >
                <Icon size={21} />
                <span>{label}</span>
              </NavLink>
            )
          )}
        </nav>

        {/* PARTE INFERIOR */}
        <div className="sidebar-bottom">
          <button
            type="button"
            className="sidebar-secondary-action"
          >
            <HelpCircle size={20} />
            <span>Ayuda</span>
          </button>

          <button
            type="button"
            className="sidebar-secondary-action"
          >
            <Info size={20} />
            <span>Acerca del sistema</span>
          </button>

          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Fondo móvil */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="sidebar-backdrop"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* ===================================================
          CONTENIDO
      =================================================== */}

      <div className="app-body">
        {/* HEADER */}
        <header className="app-header">
          <div className="header-left">
            <button
              type="button"
              className="mobile-menu-button"
              onClick={() =>
                setSidebarOpen((value) => !value)
              }
              aria-label="Abrir menú"
            >
              <Menu size={23} />
            </button>

            <div className="header-search">
              <Search size={20} />

              <input
                type="search"
                placeholder="Buscar en el sistema..."
                aria-label="Buscar en el sistema"
              />
            </div>
          </div>

          {/* USUARIO */}
          <div className="profile">
            <div className="avatar">
              {initials}
            </div>

            <div className="profile-info">
              <strong>
                {user?.name || 'Usuario'}
              </strong>

              <span>
                {user?.roles?.join(', ') ||
                  'Usuario'}
              </span>
            </div>
          </div>
        </header>

        {/* PÁGINAS */}
        <main className="app-main">
          <section className="content">
            <Outlet />
          </section>
        </main>
      </div>
    </div>
  );
}