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



import {

  hasAnyRole,

} from './permissions';



import {

  ROLES,

  ROLE_LABELS,

} from './roles';



/* =========================================================

   TIPOS

\========================================================= */



type MenuItem = {

  to: string;

  label: string;

  icon: any;

  roles: string[];

  end?: boolean;

};



/* =========================================================

   LAYOUT PRINCIPAL

\========================================================= */



export default function Layout() {

  const {

    user,

    logout,

  } = useAuth();



  const navigate =

    useNavigate();



  const [

    sidebarOpen,

    setSidebarOpen,

  ] = useState(false);



  /* =======================================================

     MENÚ SEGÚN ROL

  ======================================================= */



  const items: MenuItem[] = [

    {

      to: '/',

      label: 'Inicio',

      icon: Home,

      end: true,

      roles: [

        ROLES.ADMIN,

        ROLES.EDITOR,

        ROLES.CONSULTOR,

      ],

    },



    {

      to: '/correspondencia',

      label: 'Correspondencia',

      icon: Mail,

      roles: [

        ROLES.ADMIN,

        ROLES.EDITOR,

      ],

    },



    {

      to: '/repositorio',

      label: 'Repositorio',

      icon: FileText,

      roles: [

        ROLES.ADMIN,

        ROLES.EDITOR,

        ROLES.CONSULTOR,

      ],

    },



    {

      to: '/procedimientos',

      label: 'Procedimientos',

      icon: ClipboardList,

      roles: [

        ROLES.ADMIN,

        ROLES.EDITOR,

        ROLES.CONSULTOR,

      ],

    },



    {

      to: '/formularios',

      label: 'Formularios',

      icon: BookOpen,

      roles: [

        ROLES.ADMIN,

        ROLES.EDITOR,

        ROLES.CONSULTOR,

      ],

    },



    {

      to: '/enlaces',

      label: 'Enlaces a sistemas',

      icon: Link2,

      roles: [

        ROLES.ADMIN,

        ROLES.EDITOR,

        ROLES.CONSULTOR,

      ],

    },



    {

      to: '/noticias',

      label: 'Noticias',

      icon: Newspaper,

      roles: [

        ROLES.ADMIN,

        ROLES.EDITOR,

        ROLES.CONSULTOR,

      ],

    },



    {

      to: '/usuarios',

      label: 'Usuarios',

      icon: Users,

      roles: [

        ROLES.ADMIN,

      ],

    },



    {

      to: '/historial',

      label: 'Historial',

      icon: History,

      roles: [

        ROLES.ADMIN,

        ROLES.EDITOR,

        ROLES.CONSULTOR,

      ],

    },

  ];



  /* =======================================================

     FILTRAR MENÚ

  ======================================================= */



  const visibleItems =

    items.filter(

      (item) =>

        hasAnyRole(

          user,

          item.roles,

        ),

    );



  /* =======================================================

     CERRAR SESIÓN

  ======================================================= */



  const handleLogout = () => {

    logout();



    navigate(

      '/login',

      {

        replace: true,

      },

    );

  };



  /* =======================================================

     INICIALES DEL USUARIO

  ======================================================= */



  const initials =

    user?.name

      ?.split(' ')

      .filter(Boolean)

      .map(

        (word: string) =>

          word[0],

      )

      .slice(0, 2)

      .join('')

      .toUpperCase() ||

    'U';



  /* =======================================================

     ROL PRINCIPAL

  ======================================================= */



  const mainRole =

    user?.roles?.[0];



  const roleLabel =

    mainRole &&

    mainRole in ROLE_LABELS

      ? ROLE_LABELS[

          mainRole as keyof typeof ROLE_LABELS

        ]

      : 'Usuario';



  return (

    <div className="app">



      {/* ===================================================

          SIDEBAR

      =================================================== */}



      <aside

        className={`app-sidebar ${

          sidebarOpen

            ? 'open'

            : ''

        }`}

      >



        {/* LOGO */}

        <div className="sidebar-header">



          <div className="sidebar-brand">
            <img
              src="/branding/logo-tec.svg"
              alt="Tecnológico de Costa Rica"
              className="sidebar-logo"
            />
          </div>

          <p className="sidebar-campus">

            Campus Tecnológico de San José

          </p>



        </div>



        {/* =================================================

            MENÚ DINÁMICO

        ================================================= */}



        <nav className="sidebar-nav">



          {visibleItems.map(

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

                className={({

                  isActive,

                }) =>

                  `sidebar-link ${

                    isActive

                      ? 'active'

                      : ''

                  }`

                }

                onClick={() =>

                  setSidebarOpen(

                    false,

                  )

                }

              >



                <Icon

                  size={21}

                />



                <span>

                  {label}

                </span>



              </NavLink>

            ),

          )}



        </nav>



        {/* =================================================

            PARTE INFERIOR

        ================================================= */}



        <div className="sidebar-bottom">



          <button

            type="button"

            className="sidebar-secondary-action"

            onClick={() => {

              alert(

                'Módulo de ayuda pendiente de implementar.',

              );

            }}

          >



            <HelpCircle

              size={20}

            />



            <span>

              Ayuda

            </span>



          </button>



          <button

            type="button"

            className="sidebar-secondary-action"

            onClick={() => {

              alert(

                'Sistema de Gestión de Información Institucional - Campus Tecnológico de San José.',

              );

            }}

          >



            <Info

              size={20}

            />



            <span>

              Acerca del sistema

            </span>



          </button>



          <button

            type="button"

            className="sidebar-logout"

            onClick={

              handleLogout

            }

          >



            <LogOut

              size={20}

            />



            <span>

              Cerrar sesión

            </span>



          </button>



        </div>



      </aside>



      {/* ===================================================

          FONDO PARA MÓVIL

      =================================================== */}



      {sidebarOpen && (



        <button

          type="button"

          aria-label="Cerrar menú"

          className="sidebar-backdrop"

          onClick={() =>

            setSidebarOpen(

              false,

            )

          }

        />



      )}



      {/* ===================================================

          ÁREA PRINCIPAL

      =================================================== */}



      <div className="app-body">



        {/* =================================================

            HEADER

        ================================================= */}



        <header className="app-header">



          <div className="header-left">



            <button

              type="button"

              className="mobile-menu-button"

              onClick={() =>

                setSidebarOpen(

                  (value) =>

                    !value,

                )

              }

              aria-label="Abrir menú"

            >



              <Menu

                size={23}

              />



            </button>



            <div className="header-search">



              <Search

                size={20}

              />



              <input

                type="search"

                placeholder="Buscar en el sistema..."

                aria-label="Buscar en el sistema"

              />



            </div>



          </div>



          {/* =================================================

              PERFIL

          ================================================= */}



          <div className="profile">



            <div className="avatar">

              {initials}

            </div>



            <div className="profile-info">



              <strong>

                {user?.name ||

                  'Usuario'}

              </strong>



              <span>

                {roleLabel}

              </span>



            </div>



          </div>



        </header>



        {/* =================================================

            PÁGINAS

        ================================================= */}



        <main className="app-main">



          <section className="content">

            <Outlet />

          </section>



        </main>



      </div>



    </div>

  );

}