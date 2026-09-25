import React, { useEffect, useState } from 'react';

import { Link, useNavigate, useParams } from 'react-router-dom';

import { api } from './api';

import { Badge, Btn, Card, Empty } from './components';

import { useAuth } from './auth';
import { canManageProcedures } from './permissions';





/* =========================================================

   LOGIN

\========================================================= */



export function Login() {

  const { login } = useAuth();

  const navigate = useNavigate();



  const [email, setEmail] = useState("admin\@itcr.ac.cr");

  const [password, setPassword] = useState("Admin123!");

  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);



  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {

    e.preventDefault();



    if (loading) {

      return;

    }



    try {

      setLoading(true);

      setError("");



      const loggedUser =
        await login(
          email.trim(),
          password,
        );

      navigate(
        loggedUser
          ?.mustChangePassword
          ? "/cambiar-contrasena"
          : "/",
        { replace: true },
      );

    } catch (err) {

      console.error("Error al iniciar sesión:", err);



      setError(

        "No se pudo iniciar sesión. Verifique el correo y la contraseña."

      );

    } finally {

      setLoading(false);

    }

  }



  return (

    <div className="login-page">

      {/* =====================================================

          SIDEBAR

      ===================================================== */}

      <aside className="login-sidebar">

        <div>

          <div className="login-sidebar-brand">
            <img
              src="/branding/logo-tec.svg"
              alt="Tecnológico de Costa Rica"
              className="login-sidebar-logo"
            />

            <p>Campus Tecnológico de San José</p>
          </div>



          <div className="login-sidebar-active">

            <span className="sidebar-home-icon">⌂</span>

            <span>Inicio</span>

          </div>

        </div>



        <div className="login-sidebar-footer">

          <button

            type="button"

            onClick={() => {

              alert(

                "Para obtener ayuda, comuníquese con el administrador del sistema."

              );

            }}

          >

            <span>?</span>

            Ayuda

          </button>



          <button

            type="button"

            onClick={() => {

              alert(

                "Sistema de Gestión de Información Institucional - Campus Tecnológico de San José."

              );

            }}

          >

            <span>ⓘ</span>

            Acerca del sistema

          </button>

        </div>

      </aside>



      {/* =====================================================

          CONTENIDO PRINCIPAL

      ===================================================== */}

      <main className="login-main">

        <div className="login-background-shape login-shape-1" />

        <div className="login-background-shape login-shape-2" />



        <section className="login-card">

          {/* =================================================

              COLUMNA IZQUIERDA

          ================================================= */}

          <div className="login-form-section">

            {/* LOGO */}

            <div className="login-brand">
              <img
                src="/branding/logo-tec.svg"
                alt="Tecnológico de Costa Rica"
                className="login-brand-logo"
              />

              <strong>
                Campus Tecnológico de San José
              </strong>
            </div>



            {/* TÍTULO */}

            <div className="login-heading">

              <h1>

                Sistema de Gestión de

                <br />

                Información Institucional

              </h1>



              <p>

                Accede a documentos, correspondencia,

                <br />

                procedimientos, formularios, noticias y servicios

                <br />

                institucionales del campus.

              </p>

            </div>



            {/* =================================================

                FORMULARIO

            ================================================= */}

            <form

              onSubmit={handleSubmit}

              className="login-form"

            >

              {/* CORREO */}

              <label className="login-field">

                <span className="login-field-icon">

                  ✉

                </span>



                <div>

                  <span className="login-field-label">

                    Correo institucional

                  </span>



                  <input

                    type="email"

                    value={email}

                    onChange={(e) => {

                      setEmail(e.target.value);



                      if (error) {

                        setError("");

                      }

                    }}

                    placeholder="usuario\@itcr.ac.cr"

                    autoComplete="email"

                    disabled={loading}

                    required

                  />

                </div>

              </label>



              {/* CONTRASEÑA */}

              <label className="login-field">

                <span className="login-field-icon">

                  🔒

                </span>



                <div className="password-field-content">

                  <span className="login-field-label">

                    Contraseña

                  </span>



                  <input

                    type={

                      showPassword

                        ? "text"

                        : "password"

                    }

                    value={password}

                    onChange={(e) => {

                      setPassword(e.target.value);



                      if (error) {

                        setError("");

                      }

                    }}

                    placeholder="••••••••••••"

                    autoComplete="current-password"

                    disabled={loading}

                    required

                  />

                </div>



                {/* Mostrar / ocultar contraseña */}

                <button

                  type="button"

                  className="password-toggle"

                  onClick={() =>

                    setShowPassword(

                      (value) => !value

                    )

                  }

                  disabled={loading}

                  aria-label={

                    showPassword

                      ? "Ocultar contraseña"

                      : "Mostrar contraseña"

                  }

                  title={

                    showPassword

                      ? "Ocultar contraseña"

                      : "Mostrar contraseña"

                  }

                >

                  {showPassword ? "◉" : "◌"}

                </button>

              </label>



              {/* ERROR */}

              {error && (

                <div

                  className="login-error"

                  role="alert"

                >

                  {error}

                </div>

              )}



              {/* INICIAR SESIÓN */}

              <button

                className="login-submit"

                type="submit"

                disabled={loading}

              >

                {loading

                  ? "Ingresando..."

                  : "Iniciar sesión"}

              </button>



              {/* RECUPERACIÓN */}

              <button

                type="button"

                className="forgot-password"

                disabled={loading}

                onClick={() => {

                  alert(

                    "La recuperación de acceso se implementará posteriormente."

                  );

                }}

              >

                ¿Olvidaste tu contraseña?

              </button>

            </form>

          </div>



          {/* =================================================

              IMAGEN DEL CAMPUS

          ================================================= */}

          <div className="login-image-section">

            <img

              src="/campus-san-jose.jpg"

              alt="Campus Tecnológico de San José"

            />



            <div className="login-image-overlay" />



            <div className="login-image-message">

              <h2>

                Conocimiento

                <br />

                que conecta

              </h2>



              <div className="login-image-line" />

            </div>

          </div>

        </section>

      </main>

    </div>

  );

}




/* =========================================================
   CAMBIO OBLIGATORIO DE CONTRASEÑA
========================================================= */

export function ChangePassword() {
  const {
    user,
    completePasswordChange,
  } = useAuth();

  const navigate =
    useNavigate();

  const [currentPassword, setCurrentPassword] =
    useState('');

  const [newPassword, setNewPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showPasswords, setShowPasswords] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  const submit = async (
    event:
      React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      newPassword.length < 8
    ) {
      setError(
        'La nueva contraseña debe tener al menos 8 caracteres.',
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        'Las contraseñas nuevas no coinciden.',
      );
      return;
    }

    try {
      setLoading(true);
      setError('');

      await api.post(
        '/auth/change-password',
        {
          currentPassword,
          newPassword,
        },
      );

      completePasswordChange();

      navigate(
        '/',
        {
          replace: true,
        },
      );
    } catch (requestError: any) {
      console.error(
        'Error cambiando contraseña:',
        requestError,
      );

      setError(
        requestError
          ?.response?.data
          ?.message ||
          'No se pudo cambiar la contraseña.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-change-page">
      <section className="password-change-card">
        <img
          src="/branding/logo-tec.svg"
          alt="Tecnológico de Costa Rica"
          className="password-change-logo"
        />

        <Badge tone="blue">
          Primer ingreso
        </Badge>

        <h1>
          Cambie su contraseña
        </h1>

        <p>
          Hola {user?.name || 'usuario'}. La contraseña entregada por el administrador es temporal. Debe definir una contraseña personal antes de continuar.
        </p>

        <form
          className="password-change-form"
          onSubmit={submit}
        >
          <label>
            Contraseña temporal actual
            <input
              type={
                showPasswords
                  ? 'text'
                  : 'password'
              }
              value={
                currentPassword
              }
              onChange={(e) =>
                setCurrentPassword(
                  e.target.value,
                )
              }
              required
              autoComplete="current-password"
            />
          </label>

          <label>
            Nueva contraseña
            <input
              type={
                showPasswords
                  ? 'text'
                  : 'password'
              }
              value={
                newPassword
              }
              onChange={(e) =>
                setNewPassword(
                  e.target.value,
                )
              }
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          <label>
            Confirmar nueva contraseña
            <input
              type={
                showPasswords
                  ? 'text'
                  : 'password'
              }
              value={
                confirmPassword
              }
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value,
                )
              }
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          <label className="password-change-show">
            <input
              type="checkbox"
              checked={
                showPasswords
              }
              onChange={(e) =>
                setShowPasswords(
                  e.target.checked,
                )
              }
            />
            Mostrar contraseñas
          </label>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn"
            disabled={
              loading
            }
          >
            {loading
              ? 'Actualizando...'
              : 'Guardar nueva contraseña'}
          </button>
        </form>
      </section>
    </div>
  );
}


/* =========================================================

   DASHBOARD

\========================================================= */



export function Dashboard() {

  const [corr, setCorr] = useState<any[]>([]);

  const [repo, setRepo] = useState<any[]>([]);

  const [procs, setProcs] = useState<any[]>([]);

  const [forms, setForms] = useState<any[]>([]);

  const [news, setNews] = useState<any[]>([]);



  useEffect(() => {

    Promise.all([

      api.get('/correspondence'),

      api.get('/repository'),

      api.get('/procedures'),

      api.get('/forms'),

      api.get('/news'),

    ])

      .then(([a, b, c, d, e]) => {

        setCorr(a.data);

        setRepo(b.data);

        setProcs(c.data);

        setForms(d.data);

        setNews(e.data);

      })

      .catch((error) => {

        console.error('Error cargando el dashboard:', error);

      });

  }, []);



  return (

    <>

      <div className="heroStrip">

        <div>

          <h1>¡Hola!</h1>

          <h3>Campus Tecnológico de San José</h3>

          <p>

            Tu punto de acceso a información y seguimiento institucional.

          </p>

        </div>

      </div>



      <div className="stats">

        <Card>

          <b>Correspondencia</b>

          <strong>{corr.length}</strong>

          <span>Pendientes y seguimiento</span>

        </Card>



        <Card>

          <b>Repositorio</b>

          <strong>{repo.length}</strong>

          <span>Documentos disponibles</span>

        </Card>



        <Card>

          <b>Procedimientos</b>

          <strong>{procs.length}</strong>

          <span>Procesos registrados</span>

        </Card>



        <Card>

          <b>Formularios</b>

          <strong>{forms.length}</strong>

          <span>Recursos disponibles</span>

        </Card>



        <Card>

          <b>Noticias</b>

          <strong>{news.length}</strong>

          <span>Publicaciones</span>

        </Card>

      </div>



      <div className="grid2">

        <Card>

          <h2>Mis pendientes</h2>



          {corr.slice(0, 5).map((x) => (

            <div className="row" key={x.id}>

              <Link to={`/correspondencia/${x.id}`}>

                {x.subject}

              </Link>



              <Badge

                tone={

                  x.status === 'VENCIDO'

                    ? 'red'

                    : x.status === 'RESPONDIDO'

                    ? 'green'

                    : 'blue'

                }

              >

                {x.status}

              </Badge>

            </div>

          ))}

        </Card>



        <Card>

          <h2>Noticias recientes</h2>



          {news.slice(0, 5).map((n) => (

            <div className="row" key={n.id}>

              <span>{n.title}</span>

              <Badge>{n.category}</Badge>

            </div>

          ))}

        </Card>

      </div>

    </>

  );

}





/* =========================================================

   CORRESPONDENCIA - LISTA

\========================================================= */



export function CorrespondenceList() {

  const [data, setData] = useState<any[]>([]);



  useEffect(() => {

    api

      .get('/correspondence')

      .then((r) => setData(r.data))

      .catch((error) => {

        console.error('Error cargando correspondencia:', error);

      });

  }, []);



  return (

    <>

      <div className="titlebar">

        <div>

          <h1>Correspondencia</h1>

          <p>Documentos que requieren seguimiento</p>

        </div>



        <Link className="btn" to="/correspondencia/nueva">

          + Nueva correspondencia

        </Link>

      </div>



      <div className="stats mini">

        <Card>

          <strong>

            {data.filter((x) => x.status === 'PENDIENTE').length}

          </strong>

          <span>Pendientes</span>

        </Card>



        <Card>

          <strong>

            {data.filter((x) => x.status === 'VENCIDO').length}

          </strong>

          <span>Vencidos</span>

        </Card>



        <Card>

          <strong>

            {data.filter((x) => x.status === 'EN_REVISION').length}

          </strong>

          <span>En revisión</span>

        </Card>



        <Card>

          <strong>

            {data.filter((x) => x.status === 'RESPONDIDO').length}

          </strong>

          <span>Respondidos</span>

        </Card>

      </div>



      <Card>

        <table>

          <thead>

            <tr>

              <th>Asunto</th>

              <th>Enviado por</th>

              <th>Responsable</th>

              <th>Fecha límite</th>

              <th>Estado</th>

              <th>Acciones</th>

            </tr>

          </thead>



          <tbody>

            {data.map((x) => (

              <tr key={x.id}>

                <td>

                  <Link to={`/correspondencia/${x.id}`}>

                    {x.subject}

                  </Link>



                  <small>{x.code}</small>

                </td>



                <td>{x.sender?.name ?? '-'}</td>



                <td>{x.responsible?.name ?? '-'}</td>



                <td>

                  {x.dueDate

                    ? new Date(x.dueDate).toLocaleDateString()

                    : '-'}

                </td>



                <td>

                  <Badge

                    tone={

                      x.status === 'VENCIDO'

                        ? 'red'

                        : x.status === 'RESPONDIDO'

                        ? 'green'

                        : 'blue'

                    }

                  >

                    {x.status}

                  </Badge>

                </td>



                <td>

                  <Link to={`/correspondencia/${x.id}`}>

                    Ver

                  </Link>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </Card>

    </>

  );

}





/* =========================================================

   NUEVA CORRESPONDENCIA

\========================================================= */



export function NewCorrespondence() {

  const nav = useNavigate();



  const [users, setUsers] = useState<any[]>([]);



  const [f, setF] = useState<any>({

    subject: '',

    description: '',

    type: 'Solicitud',

    priority: 'MEDIA',

    responsibleId: '',

    dueDate: '',

  });



  useEffect(() => {

    api

      .get('/users')

      .then((r) => setUsers(r.data))

      .catch((error) => {

        console.error('Error cargando usuarios:', error);

      });

  }, []);



  const submit = async (e: React.FormEvent) => {

    e.preventDefault();



    try {

      await api.post('/correspondence', f);

      nav('/correspondencia');

    } catch (error) {

      console.error('Error creando correspondencia:', error);

      alert('No se pudo crear la correspondencia.');

    }

  };



  return (

    <>

      <h1>Nueva correspondencia</h1>



      <Card>

        <form className="form" onSubmit={submit}>

          <label>

            Asunto

            <input

              required

              value={f.subject}

              onChange={(e) =>

                setF({

                  ...f,

                  subject: e.target.value,

                })

              }

            />

          </label>



          <label>

            Tipo

            <input

              value={f.type}

              onChange={(e) =>

                setF({

                  ...f,

                  type: e.target.value,

                })

              }

            />

          </label>



          <label className="full">

            Descripción / instrucciones

            <textarea

              required

              value={f.description}

              onChange={(e) =>

                setF({

                  ...f,

                  description: e.target.value,

                })

              }

            />

          </label>



          <label>

            Prioridad

            <select

              value={f.priority}

              onChange={(e) =>

                setF({

                  ...f,

                  priority: e.target.value,

                })

              }

            >

              <option value="BAJA">Baja</option>

              <option value="MEDIA">Media</option>

              <option value="ALTA">Alta</option>

            </select>

          </label>



          <label>

            Responsable

            <select

              required

              value={f.responsibleId}

              onChange={(e) =>

                setF({

                  ...f,

                  responsibleId: e.target.value,

                })

              }

            >

              <option value="">Seleccione</option>



              {users.map((u) => (

                <option key={u.id} value={u.id}>

                  {u.name}

                </option>

              ))}

            </select>

          </label>



          <label>

            Fecha límite

            <input

              type="date"

              value={f.dueDate}

              onChange={(e) =>

                setF({

                  ...f,

                  dueDate: e.target.value,

                })

              }

            />

          </label>



          <div className="full">

            <button className="btn" type="submit">

              Enviar correspondencia

            </button>

          </div>

        </form>

      </Card>

    </>

  );

}





/* =========================================================

   DETALLE CORRESPONDENCIA

\========================================================= */



export function CorrespondenceDetail() {

  const { id } = useParams();



  const [x, setX] = useState<any>();

  const [body, setBody] = useState('');



  const load = () => {

    return api

      .get('/correspondence/' + id)

      .then((r) => {

        setX(r.data);

      })

      .catch((error) => {

        console.error(

          'Error cargando detalle de correspondencia:',

          error

        );

      });

  };



  useEffect(() => {

    void load();

  }, [id]);



  if (!x) {

    return <Empty text="Cargando..." />;

  }



  const comment = async () => {

    if (!body.trim()) {

      return;

    }



    try {

      await api.post(`/correspondence/${id}/comments`, {

        body,

      });



      setBody('');



      await load();

    } catch (error) {

      console.error('Error publicando comentario:', error);

    }

  };



  const attend = async () => {

    try {

      await api.patch(`/correspondence/${id}`, {

        status: 'RESPONDIDO',

      });



      await load();

    } catch (error) {

      console.error(

        'Error actualizando correspondencia:',

        error

      );

    }

  };



  return (

    <>

      <div className="titlebar">

        <div>

          <h1>Detalle de correspondencia</h1>

          <h2>{x.subject}</h2>

        </div>



        <Btn onClick={attend}>

          Marcar como atendido

        </Btn>

      </div>



      <div className="grid2">

        <Card>

          <h2>Resumen</h2>



          <p>

            <b>Código:</b> {x.code}

          </p>



          <p>

            <b>Enviado por:</b>{' '}

            {x.sender?.name ?? '-'}

          </p>



          <p>

            <b>Responsable:</b>{' '}

            {x.responsible?.name ?? '-'}

          </p>



          <p>

            <b>Fecha límite:</b>{' '}

            {x.dueDate

              ? new Date(x.dueDate).toLocaleDateString()

              : '-'}

          </p>



          <p>

            <b>Estado:</b>{' '}

            <Badge

              tone={

                x.status === 'VENCIDO'

                  ? 'red'

                  : x.status === 'RESPONDIDO'

                  ? 'green'

                  : 'blue'

              }

            >

              {x.status}

            </Badge>

          </p>



          <h3>Indicaciones</h3>



          <p>{x.description}</p>

        </Card>



        <Card>

          <h2>Personas involucradas</h2>



          {x.participants?.length ? (

            x.participants.map((p: any) => (

              <div className="row" key={p.id}>

                {p.name}

              </div>

            ))

          ) : (

            <p>No hay personas adicionales involucradas.</p>

          )}



          <h2>Seguimiento</h2>



          {x.comments?.length ? (

            x.comments.map((c: any) => (

              <div className="comment" key={c.id}>

                <b>{c.author?.name ?? 'Usuario'}</b>



                <small>

                  {new Date(

                    c.createdAt

                  ).toLocaleString()}

                </small>



                <p>{c.body}</p>

              </div>

            ))

          ) : (

            <p>No hay comentarios todavía.</p>

          )}

        </Card>

      </div>



      <Card>

        <h2>Respuesta / observaciones</h2>



        <textarea

          value={body}

          onChange={(e) =>

            setBody(e.target.value)

          }

          placeholder="Escriba un comentario..."

        />



        <Btn onClick={comment}>

          Publicar comentario

        </Btn>

      </Card>

    </>

  );

}





/* =========================================================

   COMPONENTE TABLA SIMPLE

\========================================================= */



type ColumnDefinition = {

  k: string;

  l: string;

  render?: (x: any) => React.ReactNode;

};



function SimpleTable({

  endpoint,

  columns,

}: {

  endpoint: string;

  columns: ColumnDefinition[];

}) {

  const [d, setD] = useState<any[]>([]);



  useEffect(() => {

    api

      .get(endpoint)

      .then((r) => setD(r.data))

      .catch((error) => {

        console.error(

          `Error cargando ${endpoint}:`,

          error

        );

      });

  }, [endpoint]);



  return (

    <Card>

      <table>

        <thead>

          <tr>

            {columns.map((c) => (

              <th key={c.k}>{c.l}</th>

            ))}

          </tr>

        </thead>



        <tbody>

          {d.map((x, i) => (

            <tr key={x.id || i}>

              {columns.map((c) => (

                <td key={c.k}>

                  {c.render

                    ? c.render(x)

                    : String(x[c.k] ?? '')}

                </td>

              ))}

            </tr>

          ))}

        </tbody>

      </table>

    </Card>

  );

}





/* =========================================================
   REPOSITORIO
========================================================= */

function formatFileSize(
  value?: number | string | null,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return '-';
  }

  const bytes =
    Number(value);

  if (
    Number.isNaN(bytes) ||
    bytes <= 0
  ) {
    return '-';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

export function Repository() {
  const { user } =
    useAuth();

  const [data, setData] =
    useState<any[]>([]);

  const [search, setSearch] =
    useState('');

  const [showForm, setShowForm] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [file, setFile] =
    useState<File | null>(
      null,
    );

  const [f, setF] =
    useState({
      name: '',
      type: 'Otro',
      category: 'Otros',
      description: '',
      version: '1.0',
      status: 'ACTIVO',
    });

  const roles =
    user?.roles || [];

  const canManage =
    roles.includes('ADMIN') ||
    roles.includes('EDITOR');

  const load = () => {
    return api
      .get('/repository')
      .then((r) =>
        setData(r.data),
      )
      .catch((error) => {
        console.error(
          'Error cargando repositorio:',
          error,
        );
      });
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered =
    data.filter((x) => {
      const q =
        search
          .trim()
          .toLowerCase();

      if (!q) {
        return true;
      }

      return [
        x.name,
        x.type,
        x.category,
        x.description,
        x.originalName,
        x.responsible?.name,
      ].some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(q),
      );
    });

  const resetForm = () => {
    setF({
      name: '',
      type: 'Otro',
      category: 'Otros',
      description: '',
      version: '1.0',
      status: 'ACTIVO',
    });

    setFile(null);
    setShowForm(false);
  };

  const upload = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    if (!file) {
      alert(
        'Seleccione un archivo para subir.',
      );
      return;
    }

    try {
      setSaving(true);

      const form =
        new FormData();

      form.append(
        'file',
        file,
      );

      form.append(
        'name',
        f.name.trim(),
      );

      form.append(
        'type',
        f.type.trim(),
      );

      form.append(
        'category',
        f.category.trim(),
      );

      form.append(
        'description',
        f.description.trim(),
      );

      form.append(
        'version',
        f.version.trim(),
      );

      form.append(
        'status',
        f.status,
      );

      await api.post(
        '/repository/upload',
        form,
        {
          headers: {
            'Content-Type':
              'multipart/form-data',
          },
        },
      );

      await load();

      resetForm();
    } catch (error) {
      console.error(
        'Error subiendo documento:',
        error,
      );

      alert(
        'No se pudo subir el archivo.',
      );
    } finally {
      setSaving(false);
    }
  };

  const download = async (
    item: any,
  ) => {
    try {
      const response =
        await api.get(
          `/repository/${item.id}/download`,
          {
            responseType:
              'blob',
          },
        );

      const url =
        URL.createObjectURL(
          response.data,
        );

      const anchor =
        document.createElement(
          'a',
        );

      anchor.href = url;

      anchor.download =
        item.originalName ||
        item.name;

      document.body
        .appendChild(
          anchor,
        );

      anchor.click();

      anchor.remove();

      URL.revokeObjectURL(
        url,
      );
    } catch (error) {
      console.error(
        'Error descargando archivo:',
        error,
      );

      alert(
        'No se pudo descargar el archivo.',
      );
    }
  };

  return (
    <>
      <div className="titlebar">
        <div>
          <h1>
            Repositorio documental
          </h1>

          <p>
            Documentos institucionales de consulta del Campus Tecnológico de San José.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            className="btn"
            onClick={() =>
              setShowForm(
                (value) =>
                  !value,
              )
            }
          >
            {showForm
              ? 'Cerrar formulario'
              : '+ Nuevo documento'}
          </button>
        )}
      </div>

      {canManage &&
        showForm && (
        <Card>
          <h2>
            Subir documento
          </h2>

          <form
            className="form"
            onSubmit={upload}
          >
            <label>
              Nombre del documento
              <input
                required
                value={f.name}
                onChange={(e) =>
                  setF({
                    ...f,
                    name:
                      e.target
                        .value,
                  })
                }
              />
            </label>

            <label>
              Tipo
              <input
                required
                value={f.type}
                onChange={(e) =>
                  setF({
                    ...f,
                    type:
                      e.target
                        .value,
                  })
                }
                placeholder="Reglamento, acta, guía..."
              />
            </label>

            <label>
              Categoría
              <input
                required
                value={
                  f.category
                }
                onChange={(e) =>
                  setF({
                    ...f,
                    category:
                      e.target
                        .value,
                  })
                }
              />
            </label>

            <label>
              Versión
              <input
                value={
                  f.version
                }
                onChange={(e) =>
                  setF({
                    ...f,
                    version:
                      e.target
                        .value,
                  })
                }
              />
            </label>

            <label>
              Estado
              <select
                value={
                  f.status
                }
                onChange={(e) =>
                  setF({
                    ...f,
                    status:
                      e.target
                        .value,
                  })
                }
              >
                <option value="ACTIVO">
                  Activo
                </option>
                <option value="EN_REVISION">
                  En revisión
                </option>
                <option value="INACTIVO">
                  Inactivo
                </option>
              </select>
            </label>

            <label>
              Archivo
              <input
                required
                type="file"
                onChange={(e) =>
                  setFile(
                    e.target
                      .files?.[0] ||
                      null,
                  )
                }
              />

              <small>
                Se permite cualquier tipo de archivo.
              </small>
            </label>

            <label className="full">
              Descripción
              <textarea
                value={
                  f.description
                }
                onChange={(e) =>
                  setF({
                    ...f,
                    description:
                      e.target
                        .value,
                  })
                }
              />
            </label>

            {file && (
              <div className="repository-selected-file full">
                <b>
                  Archivo seleccionado:
                </b>

                <span>
                  {file.name}
                </span>

                <small>
                  {formatFileSize(
                    file.size,
                  )}
                </small>
              </div>
            )}

            <div className="full repository-form-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={
                  resetForm
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn"
                disabled={
                  saving
                }
              >
                {saving
                  ? 'Subiendo...'
                  : 'Subir documento'}
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="repository-toolbar">
          <input
            type="search"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value,
              )
            }
            placeholder="Buscar por nombre, tipo, categoría o archivo..."
          />

          <span>
            {filtered.length}{' '}
            documento(s)
          </span>
        </div>
      </Card>

      <Card>
        {filtered.length ? (
          <table className="repository-table">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Tipo</th>
                <th>Categoría</th>
                <th>Versión</th>
                <th>
                  Responsable
                </th>
                <th>Archivo</th>
                <th>Tamaño</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(
                (x) => (
                  <tr key={x.id}>
                    <td>
                      <strong>
                        {x.name}
                      </strong>

                      <small>
                        {x.description ||
                          'Sin descripción'}
                      </small>
                    </td>

                    <td>
                      {x.type}
                    </td>

                    <td>
                      {x.category}
                    </td>

                    <td>
                      {x.version ||
                        '-'}
                    </td>

                    <td>
                      {x.responsible
                        ?.name ||
                        '-'}
                    </td>

                    <td>
                      {x.originalName ||
                        'Sin archivo'}
                    </td>

                    <td>
                      {formatFileSize(
                        x.size,
                      )}
                    </td>

                    <td>
                      <Badge
                        tone={
                          x.status ===
                          'ACTIVO'
                            ? 'green'
                            : x.status ===
                              'INACTIVO'
                            ? 'red'
                            : 'blue'
                        }
                      >
                        {x.status}
                      </Badge>
                    </td>

                    <td>
                      {x.storedName ? (
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() =>
                            download(x)
                          }
                        >
                          Descargar
                        </button>
                      ) : (
                        <span>
                          No disponible
                        </span>
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        ) : (
          <Empty text="No se encontraron documentos." />
        )}
      </Card>
    </>
  );
}


/* =========================================================
   PROCEDIMIENTOS
========================================================= */

type ProcedureStepForm = {
  id?: string;
  stepOrder: number;
  title: string;
  description: string;
};

type ProcedureFormState = {
  code: string;
  name: string;
  description: string;
  category: string;
  status: string;
  responsibleArea: string;
  validFrom: string;
  validUntil: string;
  normative: string;
  requirements: string;
  steps: ProcedureStepForm[];
  links: string;
  relatedFormIds: string[];
  relatedDocumentIds: string[];
};

function emptyProcedureForm(): ProcedureFormState {
  return {
    code: '',
    name: '',
    description: '',
    category: 'Administrativo',
    status: 'ACTIVO',
    responsibleArea: '',
    validFrom: '',
    validUntil: '',
    normative: '',
    requirements: '',
    steps: [
      {
        stepOrder: 1,
        title: '',
        description: '',
      },
    ],
    links: '',
    relatedFormIds: [],
    relatedDocumentIds: [],
  };
}

function splitLines(value: string) {
  return value
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
}

function parseLinks(value: string) {
  return splitLines(value)
    .map((line) => {
      const parts =
        line.split('|');

      return {
        label:
          (parts[0] || '').trim(),
        url:
          (parts[1] || '').trim(),
      };
    })
    .filter(
      (x) => x.label && x.url,
    );
}

function parseLabels(value: string) {
  return splitLines(value).map(
    (label) => ({
      label,
    }),
  );
}

function procedurePayload(
  f: ProcedureFormState,
) {
  return {
    code: f.code.trim(),
    name: f.name.trim(),
    description:
      f.description.trim(),
    category:
      f.category.trim(),
    status: f.status,
    responsibleArea:
      f.responsibleArea.trim(),
    validFrom:
      f.validFrom || null,
    validUntil:
      f.validUntil || null,
    normative:
      f.normative.trim() || null,
    requirements:
      splitLines(
        f.requirements,
      ),
    steps:
      f.steps
        .map(
          (
            step,
            index,
          ) => ({
            ...step,
            stepOrder: index + 1,
            title:
              step.title.trim(),
            description:
              step.description.trim(),
          }),
        )
        .filter(
          (step) =>
            step.title ||
            step.description,
        ),
    links:
      parseLinks(f.links),
    relatedForms:
      f.relatedFormIds.map(
        (formId) => ({
          formId,
        }),
      ),
    relatedDocuments:
      f.relatedDocumentIds.map(
        (documentId) => ({
          documentId,
        }),
      ),
  };
}

export function Procedures() {
  const { user } = useAuth();

  const [data, setData] =
    useState<any[]>([]);

  const [search, setSearch] =
    useState('');

  const [category, setCategory] =
    useState('TODAS');

  const [status, setStatus] =
    useState('TODOS');

  const [area, setArea] =
    useState('TODAS');

  useEffect(() => {
    api
      .get('/procedures')
      .then((r) => setData(r.data))
      .catch((error) => {
        console.error(
          'Error cargando procedimientos:',
          error,
        );
      });
  }, []);

  const canManage =
    canManageProcedures(user);

  const categories = Array.from(
    new Set(
      data
        .map((x) => x.category)
        .filter(Boolean),
    ),
  ).sort();

  const areas = Array.from(
    new Set(
      data
        .map((x) => x.responsibleArea)
        .filter(Boolean),
    ),
  ).sort();

  const filtered =
    data.filter((x) => {
      const q =
        search
          .trim()
          .toLowerCase();

      const matchesText =
        !q ||
        [
          x.code,
          x.name,
          x.description,
          x.category,
          x.responsibleArea,
        ].some((value) =>
          String(value ?? '')
            .toLowerCase()
            .includes(q),
        );

      return (
        matchesText &&
        (
          category === 'TODAS' ||
          x.category === category
        ) &&
        (
          status === 'TODOS' ||
          x.status === status
        ) &&
        (
          area === 'TODAS' ||
          x.responsibleArea === area
        )
      );
    });

  return (
    <>
      <div className="titlebar">
        <div>
          <h1>
            Procedimientos institucionales
          </h1>

          <p>
            Consulta y gestiona los procedimientos del Campus Tecnológico de San José.
          </p>
        </div>

        {canManage && (
          <Link
            className="btn"
            to="/procedimientos/nuevo"
          >
            + Nuevo procedimiento
          </Link>
        )}
      </div>

      <div className="procedure-stats">
        <Card>
          <b>Total</b>
          <strong>
            {data.length}
          </strong>
          <span>
            Procedimientos registrados
          </span>
        </Card>

        <Card>
          <b>Activos</b>
          <strong>
            {
              data.filter(
                (x) =>
                  String(
                    x.status,
                  ).toUpperCase() ===
                  'ACTIVO',
              ).length
            }
          </strong>
          <span>
            Disponibles para consulta
          </span>
        </Card>

        <Card>
          <b>En revisión</b>
          <strong>
            {
              data.filter(
                (x) =>
                  String(
                    x.status,
                  ).toUpperCase() ===
                  'EN_REVISION',
              ).length
            }
          </strong>
          <span>
            Pendientes de actualización
          </span>
        </Card>
      </div>

      <Card>
        <div className="procedure-toolbar">
          <label>
            Buscar
            <input
              type="search"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value,
                )
              }
              placeholder="Nombre, código o descripción"
            />
          </label>

          <label>
            Categoría
            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value,
                )
              }
            >
              <option value="TODAS">
                Todas
              </option>

              {categories.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Estado
            <select
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value,
                )
              }
            >
              <option value="TODOS">
                Todos
              </option>
              <option value="ACTIVO">
                Activo
              </option>
              <option value="EN_REVISION">
                En revisión
              </option>
              <option value="INACTIVO">
                Inactivo
              </option>
            </select>
          </label>

          <label>
            Área responsable
            <select
              value={area}
              onChange={(e) =>
                setArea(
                  e.target.value,
                )
              }
            >
              <option value="TODAS">
                Todas
              </option>

              {areas.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
      </Card>

      <Card>
        {filtered.length ? (
          <table className="procedure-table">
            <thead>
              <tr>
                <th>Procedimiento</th>
                <th>Categoría</th>
                <th>
                  Área responsable
                </th>
                <th>Estado</th>
                <th>Vigencia</th>
                <th>Actualizado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map(
                (x) => (
                  <tr key={x.id}>
                    <td>
                      <Link
                        className="procedure-name-link"
                        to={`/procedimientos/${x.id}`}
                      >
                        {x.name}
                      </Link>

                      <small>
                        {x.code}
                      </small>
                    </td>

                    <td>
                      {x.category}
                    </td>

                    <td>
                      {x.responsibleArea}
                    </td>

                    <td>
                      <Badge
                        tone={
                          String(
                            x.status,
                          ).toUpperCase() ===
                          'ACTIVO'
                            ? 'green'
                            : String(
                                x.status,
                              ).toUpperCase() ===
                              'INACTIVO'
                            ? 'red'
                            : 'blue'
                        }
                      >
                        {String(
                          x.status,
                        ).replace(
                          '_',
                          ' ',
                        )}
                      </Badge>
                    </td>

                    <td>
                      {x.validFrom
                        ? new Date(
                            x.validFrom,
                          ).toLocaleDateString()
                        : 'Sin fecha'}

                      {x.validUntil
                        ? ` - ${new Date(
                            x.validUntil,
                          ).toLocaleDateString()}`
                        : ''}
                    </td>

                    <td>
                      {x.updatedAt
                        ? new Date(
                            x.updatedAt,
                          ).toLocaleDateString()
                        : '-'}
                    </td>

                    <td>
                      <div className="procedure-actions">
                        <Link
                          className="btn secondary"
                          to={`/procedimientos/${x.id}`}
                        >
                          Ver
                        </Link>

                        {canManage && (
                          <Link
                            className="btn secondary"
                            to={`/procedimientos/${x.id}/editar`}
                          >
                            Editar
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        ) : (
          <Empty text="No se encontraron procedimientos." />
        )}
      </Card>
    </>
  );
}

function ProcedureForm({
  initial,
  title,
  submitText,
  onSubmit,
  backPath = '/procedimientos',
  backLabel = 'Volver',
}: {
  initial: ProcedureFormState;
  title: string;
  submitText: string;
  onSubmit: (
    form: ProcedureFormState,
  ) => Promise<void>;
  backPath?: string;
  backLabel?: string;
}) {
  const nav =
    useNavigate();

  const [f, setF] =
    useState(initial);

  const [saving, setSaving] =
    useState(false);

  const [repositoryDocuments, setRepositoryDocuments] =
    useState<any[]>([]);

  const [institutionalForms, setInstitutionalForms] =
    useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/repository'),
      api.get('/forms'),
    ])
      .then(([documentsResponse, formsResponse]) => {
        setRepositoryDocuments(documentsResponse.data);
        setInstitutionalForms(formsResponse.data);
      })
      .catch((error) => {
        console.error(
          'Error cargando recursos relacionados:',
          error,
        );
      });
  }, []);

  const toggleDocument = (
    documentId: string,
  ) => {
    setF((current) => ({
      ...current,
      relatedDocumentIds:
        current.relatedDocumentIds.includes(documentId)
          ? current.relatedDocumentIds.filter(
              (id) => id !== documentId,
            )
          : [
              ...current.relatedDocumentIds,
              documentId,
            ],
    }));
  };

  const toggleForm = (
    formId: string,
  ) => {
    setF((current) => ({
      ...current,
      relatedFormIds:
        current.relatedFormIds.includes(formId)
          ? current.relatedFormIds.filter(
              (id) => id !== formId,
            )
          : [
              ...current.relatedFormIds,
              formId,
            ],
    }));
  };

  const addStep = () => {
    setF({
      ...f,
      steps: [
        ...f.steps,
        {
          stepOrder:
            f.steps.length + 1,
          title: '',
          description: '',
        },
      ],
    });
  };

  const removeStep = (
    index: number,
  ) => {
    setF({
      ...f,
      steps:
        f.steps
          .filter(
            (_x, i) =>
              i !== index,
          )
          .map(
            (x, i) => ({
              ...x,
              stepOrder: i + 1,
            }),
          ),
    });
  };

  const submit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    try {
      setSaving(true);
      await onSubmit(f);
    } catch (error) {
      console.error(
        'Error guardando procedimiento:',
        error,
      );

      alert(
        'No se pudo guardar el procedimiento.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="titlebar">
        <div>
          <h1>{title}</h1>
          <p>
            Complete la información del procedimiento institucional.
          </p>
        </div>

        <button
          className="btn secondary"
          type="button"
          onClick={() =>
            nav(backPath)
          }
        >
          {backLabel}
        </button>
      </div>

      <form
        className="procedure-form"
        onSubmit={submit}
      >
        <Card>
          <h2>
            Información general
          </h2>

          <div className="form">
            <label>
              Código
              <input
                required
                value={f.code}
                onChange={(e) =>
                  setF({
                    ...f,
                    code:
                      e.target.value,
                  })
                }
                placeholder="SG-PR-02"
              />
            </label>

            <label>
              Nombre
              <input
                required
                value={f.name}
                onChange={(e) =>
                  setF({
                    ...f,
                    name:
                      e.target.value,
                  })
                }
              />
            </label>

            <label>
              Categoría
              <input
                required
                value={f.category}
                onChange={(e) =>
                  setF({
                    ...f,
                    category:
                      e.target.value,
                  })
                }
              />
            </label>

            <label>
              Estado
              <select
                value={f.status}
                onChange={(e) =>
                  setF({
                    ...f,
                    status:
                      e.target.value,
                  })
                }
              >
                <option value="ACTIVO">
                  Activo
                </option>
                <option value="EN_REVISION">
                  En revisión
                </option>
                <option value="INACTIVO">
                  Inactivo
                </option>
              </select>
            </label>

            <label className="full">
              Área responsable
              <input
                required
                value={
                  f.responsibleArea
                }
                onChange={(e) =>
                  setF({
                    ...f,
                    responsibleArea:
                      e.target.value,
                  })
                }
              />
            </label>

            <label>
              Vigente desde
              <input
                type="date"
                value={f.validFrom}
                onChange={(e) =>
                  setF({
                    ...f,
                    validFrom:
                      e.target.value,
                  })
                }
              />
            </label>

            <label>
              Vigente hasta
              <input
                type="date"
                value={f.validUntil}
                onChange={(e) =>
                  setF({
                    ...f,
                    validUntil:
                      e.target.value,
                  })
                }
              />
            </label>

            <label className="full">
              Descripción
              <textarea
                required
                value={
                  f.description
                }
                onChange={(e) =>
                  setF({
                    ...f,
                    description:
                      e.target.value,
                  })
                }
              />
            </label>

            <label className="full">
              Normativa relacionada
              <textarea
                value={f.normative}
                onChange={(e) =>
                  setF({
                    ...f,
                    normative:
                      e.target.value,
                  })
                }
              />
            </label>

            <label className="full">
              Requisitos
              <textarea
                value={f.requirements}
                onChange={(e) =>
                  setF({
                    ...f,
                    requirements:
                      e.target.value,
                  })
                }
                placeholder="Un requisito por línea"
              />
            </label>
          </div>
        </Card>

        <Card>
          <div className="procedure-section-header">
            <div>
              <h2>
                Paso a paso
              </h2>
              <p>
                Agregue los pasos en el orden correcto.
              </p>
            </div>

            <button
              className="btn secondary"
              type="button"
              onClick={addStep}
            >
              + Agregar paso
            </button>
          </div>

          <div className="procedure-step-list">
            {f.steps.map(
              (
                step,
                index,
              ) => (
                <div
                  className="procedure-step-editor"
                  key={
                    step.id ||
                    index
                  }
                >
                  <div className="procedure-step-number">
                    {index + 1}
                  </div>

                  <div className="procedure-step-fields">
                    <input
                      value={
                        step.title
                      }
                      placeholder="Título del paso"
                      onChange={(e) => {
                        const steps =
                          [...f.steps];

                        steps[index] = {
                          ...steps[index],
                          title:
                            e.target.value,
                        };

                        setF({
                          ...f,
                          steps,
                        });
                      }}
                    />

                    <textarea
                      value={
                        step.description
                      }
                      placeholder="Descripción del paso"
                      onChange={(e) => {
                        const steps =
                          [...f.steps];

                        steps[index] = {
                          ...steps[index],
                          description:
                            e.target.value,
                        };

                        setF({
                          ...f,
                          steps,
                        });
                      }}
                    />
                  </div>

                  {f.steps.length >
                    1 && (
                    <button
                      className="procedure-remove-step"
                      type="button"
                      onClick={() =>
                        removeStep(
                          index,
                        )
                      }
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              ),
            )}
          </div>
        </Card>

        <Card>
          <h2>
            Recursos relacionados
          </h2>

          <div className="procedure-resource-grid">
            <div className="procedure-resource-selector">
              <div className="procedure-resource-selector-header">
                <div>
                  <h3>Documentos del repositorio</h3>
                  <p>
                    Seleccione los documentos que forman parte de este procedimiento.
                  </p>
                </div>

                <Badge>
                  {f.relatedDocumentIds.length} seleccionado(s)
                </Badge>
              </div>

              {repositoryDocuments.length ? (
                <div className="procedure-resource-options">
                  {repositoryDocuments.map((document: any) => (
                    <label
                      className="procedure-resource-option"
                      key={document.id}
                    >
                      <input
                        type="checkbox"
                        checked={f.relatedDocumentIds.includes(document.id)}
                        onChange={() =>
                          toggleDocument(document.id)
                        }
                      />

                      <span>
                        <strong>{document.name}</strong>
                        <small>
                          {document.originalName ||
                            document.type ||
                            'Documento'}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="procedure-resource-empty">
                  No hay documentos registrados en el repositorio.
                </p>
              )}
            </div>

            <div className="procedure-resource-selector">
              <div className="procedure-resource-selector-header">
                <div>
                  <h3>Formularios institucionales</h3>
                  <p>
                    Seleccione los formularios necesarios para completar el trámite.
                  </p>
                </div>

                <Badge>
                  {f.relatedFormIds.length} seleccionado(s)
                </Badge>
              </div>

              {institutionalForms.length ? (
                <div className="procedure-resource-options">
                  {institutionalForms.map((form: any) => (
                    <label
                      className="procedure-resource-option"
                      key={form.id}
                    >
                      <input
                        type="checkbox"
                        checked={f.relatedFormIds.includes(form.id)}
                        onChange={() =>
                          toggleForm(form.id)
                        }
                      />

                      <span>
                        <strong>{form.name}</strong>
                        <small>
                          {form.originalName ||
                            form.format ||
                            'Formulario'}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="procedure-resource-empty">
                  No hay formularios registrados.
                </p>
              )}
            </div>
          </div>

          <div className="form procedure-links-editor">
            <label className="full">
              Enlaces externos
              <textarea
                value={f.links}
                onChange={(e) =>
                  setF({
                    ...f,
                    links:
                      e.target.value,
                  })
                }
                placeholder="Nombre | https://ejemplo.com"
              />
            </label>
          </div>
        </Card>

        <div className="procedure-form-actions">
          <button
            className="btn secondary"
            type="button"
            onClick={() =>
              nav(backPath)
            }
          >
            Cancelar
          </button>

          <button
            className="btn"
            type="submit"
            disabled={saving}
          >
            {saving
              ? 'Guardando...'
              : submitText}
          </button>
        </div>
      </form>
    </>
  );
}

export function NewProcedure() {
  const nav =
    useNavigate();

  return (
    <ProcedureForm
      initial={
        emptyProcedureForm()
      }
      title="Nuevo procedimiento"
      submitText="Crear procedimiento"
      onSubmit={async (f) => {
        const r =
          await api.post(
            '/procedures',
            procedurePayload(f),
          );

        nav(
          `/procedimientos/${r.data.id}`,
        );
      }}
    />
  );
}

export function EditProcedure() {
  const { id } =
    useParams();

  const nav =
    useNavigate();

  const [initial, setInitial] =
    useState<ProcedureFormState | null>(
      null,
    );

  useEffect(() => {
    api
      .get(
        `/procedures/${id}`,
      )
      .then((r) => {
        const x = r.data;

        setInitial({
          code:
            x.code || '',
          name:
            x.name || '',
          description:
            x.description || '',
          category:
            x.category || '',
          status:
            x.status ||
            'ACTIVO',
          responsibleArea:
            x.responsibleArea ||
            '',
          validFrom:
            x.validFrom
              ? String(
                  x.validFrom,
                ).slice(0, 10)
              : '',
          validUntil:
            x.validUntil
              ? String(
                  x.validUntil,
                ).slice(0, 10)
              : '',
          normative:
            x.normative || '',
          requirements:
            Array.isArray(
              x.requirements,
            )
              ? x.requirements.join(
                  '\n',
                )
              : '',
          steps:
            Array.isArray(
              x.steps,
            ) &&
            x.steps.length
              ? [...x.steps].sort(
                  (
                    a: any,
                    b: any,
                  ) =>
                    a.stepOrder -
                    b.stepOrder,
                )
              : [
                  {
                    stepOrder: 1,
                    title: '',
                    description:
                      '',
                  },
                ],
          links:
            Array.isArray(
              x.links,
            )
              ? x.links
                  .map(
                    (l: any) =>
                      `${l.label} | ${l.url}`,
                  )
                  .join('\n')
              : '',
          relatedFormIds:
            Array.isArray(
              x.relatedForms,
            )
              ? x.relatedForms
                  .map(
                    (form: any) =>
                      form.formId,
                  )
                  .filter(Boolean)
              : [],
          relatedDocumentIds:
            Array.isArray(
              x.relatedDocuments,
            )
              ? x.relatedDocuments
                  .map(
                    (document: any) =>
                      document.documentId,
                  )
                  .filter(Boolean)
              : [],
        });
      });
  }, [id]);

  if (!initial) {
    return (
      <Empty text="Cargando procedimiento..." />
    );
  }

  return (
    <ProcedureForm
      initial={initial}
      title="Editar procedimiento"
      submitText="Guardar cambios"
      backPath={`/procedimientos/${id}`}
      backLabel="Volver al procedimiento"
      onSubmit={async (f) => {
        await api.patch(
          `/procedures/${id}`,
          procedurePayload(f),
        );

        nav(
          `/procedimientos/${id}`,
        );
      }}
    />
  );
}

export function ProcedureDetail() {
  const { id } =
    useParams();

  const { user } =
    useAuth();

  const [x, setX] =
    useState<any>();

  const [repositoryDocuments, setRepositoryDocuments] =
    useState<any[]>([]);

  const [institutionalForms, setInstitutionalForms] =
    useState<any[]>([]);

  const [downloadingAll, setDownloadingAll] =
    useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/procedures/' + id),
      api.get('/repository'),
      api.get('/forms'),
    ])
      .then(
        ([
          procedureResponse,
          documentsResponse,
          formsResponse,
        ]) => {
          setX(procedureResponse.data);
          setRepositoryDocuments(documentsResponse.data);
          setInstitutionalForms(formsResponse.data);
        },
      )
      .catch((error) => {
        console.error(
          'Error cargando procedimiento:',
          error,
        );
      });
  }, [id]);

  if (!x) {
    return (
      <Empty text="Cargando..." />
    );
  }

  const canManage =
    canManageProcedures(user);

  const steps =
    Array.isArray(x.steps)
      ? [...x.steps].sort(
          (
            a: any,
            b: any,
          ) =>
            a.stepOrder -
            b.stepOrder,
        )
      : [];

  const relatedDocuments =
    Array.isArray(x.relatedDocuments)
      ? x.relatedDocuments
          .map((relation: any) => {
            const document =
              repositoryDocuments.find(
                (item) =>
                  item.id === relation.documentId,
              );

            return document
              ? {
                  ...document,
                  relationLabel: relation.label,
                }
              : relation.documentId
              ? null
              : {
                  id: null,
                  name:
                    relation.label ||
                    'Documento relacionado',
                  originalName: null,
                  storedName: null,
                };
          })
          .filter(Boolean)
      : [];

  const relatedForms =
    Array.isArray(x.relatedForms)
      ? x.relatedForms
          .map((relation: any) => {
            const form =
              institutionalForms.find(
                (item) =>
                  item.id === relation.formId,
              );

            return form
              ? {
                  ...form,
                  relationLabel: relation.label,
                }
              : relation.formId
              ? null
              : {
                  id: null,
                  name:
                    relation.label ||
                    'Formulario relacionado',
                  originalName: null,
                  storedName: null,
                };
          })
          .filter(Boolean)
      : [];

  const downloadRelatedResource = async (
    endpoint: string,
    fileName: string,
  ) => {
    try {
      const response =
        await api.get(endpoint, {
          responseType: 'blob',
        });

      const url =
        URL.createObjectURL(
          response.data,
        );

      const anchor =
        document.createElement('a');

      anchor.href = url;
      anchor.download = fileName;

      document.body.appendChild(
        anchor,
      );

      anchor.click();
      anchor.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        'Error descargando recurso relacionado:',
        error,
      );

      alert(
        'No se pudo descargar el recurso.',
      );
    }
  };

  const downloadableResources =
    [
      ...relatedDocuments,
      ...relatedForms,
    ].filter(
      (resource: any) =>
        resource.id &&
        resource.storedName,
    );

  const downloadAllResources =
    async () => {
      if (
        !downloadableResources.length
      ) {
        alert(
          'No hay archivos relacionados disponibles para descargar.',
        );
        return;
      }

      try {
        setDownloadingAll(true);

        const response =
          await api.get(
            `/procedures/${id}/resources/download-all`,
            {
              responseType:
                'blob',
            },
          );

        const url =
          URL.createObjectURL(
            response.data,
          );

        const anchor =
          document.createElement(
            'a',
          );

        anchor.href = url;

        anchor.download =
          `${x.code || 'procedimiento'}-recursos.zip`;

        document.body
          .appendChild(
            anchor,
          );

        anchor.click();
        anchor.remove();

        URL.revokeObjectURL(
          url,
        );
      } catch (error) {
        console.error(
          'Error descargando recursos en ZIP:',
          error,
        );

        alert(
          'No se pudieron descargar todos los recursos.',
        );
      } finally {
        setDownloadingAll(false);
      }
    };


  return (
    <>
      <div className="titlebar">
        <div>
          <small className="procedure-code">
            {x.code}
          </small>

          <h1>{x.name}</h1>

          <p>
            {x.responsibleArea}
          </p>
        </div>

        <div className="procedure-detail-actions">
          <Link
            className="btn secondary"
            to="/procedimientos"
          >
            ← Volver
          </Link>

          {downloadableResources.length > 0 && (
            <button
              type="button"
              className="btn secondary"
              onClick={
                downloadAllResources
              }
              disabled={
                downloadingAll
              }
            >
              {downloadingAll
                ? 'Generando ZIP...'
                : 'Descargar todos (.zip)'}
            </button>
          )}

          {canManage && (
            <Link
              className="btn"
              to={`/procedimientos/${x.id}/editar`}
            >
              Editar procedimiento
            </Link>
          )}
        </div>
      </div>

      <div className="procedure-detail-summary">
        <Card>
          <b>Estado</b>
          <Badge
            tone={
              String(
                x.status,
              ).toUpperCase() ===
              'ACTIVO'
                ? 'green'
                : String(
                    x.status,
                  ).toUpperCase() ===
                  'INACTIVO'
                ? 'red'
                : 'blue'
            }
          >
            {String(
              x.status,
            ).replace(
              '_',
              ' ',
            )}
          </Badge>
        </Card>

        <Card>
          <b>Categoría</b>
          <span>
            {x.category || '-'}
          </span>
        </Card>

        <Card>
          <b>Vigencia</b>
          <span>
            {x.validFrom
              ? new Date(
                  x.validFrom,
                ).toLocaleDateString()
              : 'Sin fecha'}

            {x.validUntil
              ? ` - ${new Date(
                  x.validUntil,
                ).toLocaleDateString()}`
              : ''}
          </span>
        </Card>

        <Card>
          <b>
            Última actualización
          </b>
          <span>
            {x.updatedAt
              ? new Date(
                  x.updatedAt,
                ).toLocaleDateString()
              : '-'}
          </span>
        </Card>
      </div>

      <div className="grid2">
        <Card>
          <h2>
            Descripción general
          </h2>

          <p>{x.description}</p>

          <h2>Requisitos</h2>

          {x.requirements?.length ? (
            x.requirements.map(
              (r: string) => (
                <div
                  className="check"
                  key={r}
                >
                  ✓ {r}
                </div>
              ),
            )
          ) : (
            <p>
              No se registraron requisitos.
            </p>
          )}

          <h2>
            Normativa relacionada
          </h2>

          <p>
            {x.normative ||
              'No se registró normativa relacionada.'}
          </p>
        </Card>

        <Card>
          <h2>
            Pasos del procedimiento
          </h2>

          {steps.length ? (
            steps.map(
              (s: any) => (
                <div
                  className="step"
                  key={s.id}
                >
                  <b>
                    {s.stepOrder}.{' '}
                    {s.title}
                  </b>

                  <p>
                    {s.description}
                  </p>
                </div>
              ),
            )
          ) : (
            <p>
              No hay pasos registrados.
            </p>
          )}
        </Card>
      </div>

      <div className="grid2">
        <Card>
          <h2>
            Documentos relacionados
          </h2>

          {relatedDocuments.length ? (
            <div className="procedure-related-list">
              {relatedDocuments.map(
                (document: any, index: number) => (
                  <div
                    className="procedure-related-resource"
                    key={
                      document.id ||
                      `${document.name}-${index}`
                    }
                  >
                    <div>
                      <strong>
                        {document.name ||
                          document.relationLabel}
                      </strong>

                      <small>
                        {document.originalName ||
                          'Referencia registrada'}
                      </small>
                    </div>

                    {document.id &&
                      document.storedName && (
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() =>
                          downloadRelatedResource(
                            `/repository/${document.id}/download`,
                            document.originalName ||
                              document.name,
                          )
                        }
                      >
                        Descargar
                      </button>
                    )}
                  </div>
                ),
              )}
            </div>
          ) : (
            <p>
              No hay documentos relacionados.
            </p>
          )}

          <h2 className="procedure-related-subtitle">
            Formularios relacionados
          </h2>

          {relatedForms.length ? (
            <div className="procedure-related-list">
              {relatedForms.map(
                (form: any, index: number) => (
                  <div
                    className="procedure-related-resource"
                    key={
                      form.id ||
                      `${form.name}-${index}`
                    }
                  >
                    <div>
                      <strong>
                        {form.name ||
                          form.relationLabel}
                      </strong>

                      <small>
                        {form.originalName ||
                          form.format ||
                          'Referencia registrada'}
                      </small>
                    </div>

                    {form.id &&
                      form.storedName && (
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() =>
                          downloadRelatedResource(
                            `/forms/${form.id}/download`,
                            form.originalName ||
                              form.name,
                          )
                        }
                      >
                        Descargar
                      </button>
                    )}
                  </div>
                ),
              )}
            </div>
          ) : (
            <p>
              No hay formularios relacionados.
            </p>
          )}
        </Card>

        <Card>
          <h2>
            Enlaces útiles
          </h2>

          {x.links?.length ? (
            x.links.map(
              (l: any) => (
                <a
                  className="row"
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  key={l.url}
                >
                  {l.label}
                </a>
              ),
            )
          ) : (
            <p>
              No hay enlaces registrados.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}


/* =========================================================
   FORMULARIOS
========================================================= */

export function Forms() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [f, setF] = useState({ name: '', description: '', category: 'Otros', format: '' });
  const roles = user?.roles || [];
  const canManage = roles.includes('ADMIN') || roles.includes('EDITOR');

  const load = () => api.get('/forms').then((r) => setData(r.data)).catch((error) => console.error('Error cargando formularios:', error));
  useEffect(() => { void load(); }, []);

  const filtered = data.filter((x) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [x.name,x.description,x.category,x.format,x.originalName,x.createdBy?.name,x.updatedBy?.name].some((value) => String(value ?? '').toLowerCase().includes(q));
  });

  const resetForm = () => {
    setF({ name: '', description: '', category: 'Otros', format: '' });
    setFile(null);
    setShowForm(false);
  };

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { alert('Seleccione un archivo.'); return; }
    try {
      setSaving(true);
      const form = new FormData();
      form.append('file', file);
      form.append('name', f.name.trim());
      form.append('description', f.description.trim());
      form.append('category', f.category.trim());
      if (f.format.trim()) form.append('format', f.format.trim());
      await api.post('/forms/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      await load();
      resetForm();
    } catch (error) {
      console.error('Error subiendo formulario:', error);
      alert('No se pudo subir el formulario.');
    } finally { setSaving(false); }
  };

  const download = async (item: any) => {
    try {
      const response = await api.get(`/forms/${item.id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = item.originalName || item.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      await load();
    } catch (error) {
      console.error('Error descargando formulario:', error);
      alert('No se pudo descargar el formulario.');
    }
  };

  return (
    <>
      <div className="titlebar">
        <div>
          <h1>Formularios institucionales</h1>
          <p>Consulta y descarga formularios del Campus Tecnológico de San José.</p>
        </div>
        {canManage && (
          <button type="button" className="btn" onClick={() => setShowForm((value) => !value)}>
            {showForm ? 'Cerrar formulario' : '+ Nuevo formulario'}
          </button>
        )}
      </div>

      {canManage && showForm && (
        <Card>
          <h2>Subir formulario</h2>
          <form className="form" onSubmit={upload}>
            <label>Nombre<input required value={f.name} onChange={(e) => setF({...f,name:e.target.value})} /></label>
            <label>Categoría<input required value={f.category} onChange={(e) => setF({...f,category:e.target.value})} /></label>
            <label>Formato<input value={f.format} onChange={(e) => setF({...f,format:e.target.value})} placeholder="Opcional; se detecta del archivo" /></label>
            <label>Archivo<input required type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} /><small>Se permite cualquier tipo de archivo.</small></label>
            <label className="full">Descripción<textarea value={f.description} onChange={(e) => setF({...f,description:e.target.value})} /></label>
            {file && <div className="repository-selected-file full"><b>Archivo seleccionado:</b><span>{file.name}</span><small>{formatFileSize(file.size)}</small></div>}
            <div className="full repository-form-actions">
              <button type="button" className="btn secondary" onClick={resetForm}>Cancelar</button>
              <button type="submit" className="btn" disabled={saving}>{saving ? 'Subiendo...' : 'Subir formulario'}</button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="repository-toolbar">
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar formulario..." />
          <span>{filtered.length} formulario(s)</span>
        </div>
      </Card>

      <Card>
        {filtered.length ? (
          <table className="repository-table">
            <thead><tr><th>Formulario</th><th>Categoría</th><th>Formato</th><th>Archivo</th><th>Tamaño</th><th>Agregado por</th><th>Actualizado por</th><th>Descargas</th><th>Actualización</th><th>Acciones</th></tr></thead>
            <tbody>
              {filtered.map((x) => (
                <tr key={x.id}>
                  <td><strong>{x.name}</strong><small>{x.description || 'Sin descripción'}</small></td>
                  <td>{x.category}</td><td>{x.format}</td><td>{x.originalName || 'Sin archivo'}</td><td>{formatFileSize(x.size)}</td>
                  <td>{x.createdBy?.name || '-'}</td><td>{x.updatedBy?.name || '-'}</td><td>{x.downloads ?? 0}</td>
                  <td>{x.updatedAt ? new Date(x.updatedAt).toLocaleDateString() : '-'}</td>
                  <td>{x.storedName ? <button type="button" className="btn secondary" onClick={() => download(x)}>Descargar</button> : <span>No disponible</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <Empty text="No se encontraron formularios." />}
      </Card>
    </>
  );
}


/* =========================================================

   ENLACES

\========================================================= */



export function Links() {

  const [d, setD] = useState<any[]>([]);



  useEffect(() => {

    api

      .get('/links')

      .then((r) => setD(r.data))

      .catch((error) => {

        console.error(

          'Error cargando enlaces:',

          error

        );

      });

  }, []);



  return (

    <>

      <h1>Enlaces a sistemas</h1>



      <p>

        Accede de manera rápida a los principales sistemas

        institucionales.

      </p>



      <div className="cards">

        {d.map((x) => (

          <Card key={x.id}>

            <h3>{x.name}</h3>



            <p>{x.description}</p>



            <a

              className="btn"

              href={x.url}

              target="_blank"

              rel="noreferrer"

            >

              Ir al sistema

            </a>

          </Card>

        ))}

      </div>

    </>

  );

}





/* =========================================================

   NOTICIAS

\========================================================= */



export function News() {

  const [d, setD] = useState<any[]>([]);



  useEffect(() => {

    api

      .get('/news')

      .then((r) => setD(r.data))

      .catch((error) => {

        console.error(

          'Error cargando noticias:',

          error

        );

      });

  }, []);



  return (

    <>

      <h1>Noticias</h1>



      <p>

        Mantente informado sobre actividades y comunicados del

        Campus Tecnológico de San José.

      </p>



      <div className="cards">

        {d.map((x) => (

          <Card key={x.id}>

            <Badge>{x.category}</Badge>



            <h3>{x.title}</h3>



            <p>{x.summary}</p>



            <small>

              {x.createdAt

                ? new Date(

                    x.createdAt

                  ).toLocaleDateString()

                : ''}

            </small>

          </Card>

        ))}

      </div>

    </>

  );

}





/* =========================================================

   USUARIOS

\========================================================= */



export function Users() {
  const { user } =
    useAuth();

  const [data, setData] =
    useState<any[]>([]);

  const [savingId, setSavingId] =
    useState<string | null>(
      null,
    );

  const [editing, setEditing] =
    useState<any | null>(
      null,
    );

  const [deleteTarget, setDeleteTarget] =
    useState<any | null>(
      null,
    );

  const [deleteReason, setDeleteReason] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [showCreate, setShowCreate] =
    useState(false);

  const [creating, setCreating] =
    useState(false);

  const [createPasswordMode, setCreatePasswordMode] =
    useState<
      'AUTO' | 'MANUAL'
    >('AUTO');

  const [createForm, setCreateForm] =
    useState({
      name: '',
      email: '',
      position: '',
      roleName:
        'CONSULTOR',
      password: '',
    });

  const [temporaryCredential, setTemporaryCredential] =
    useState<{
      name: string;
      email: string;
      password: string;
      origin:
        | 'CREATE'
        | 'RESET';
    } | null>(
      null,
    );

  const currentUserId =
    (user as any)?.id ||
    (user as any)?.sub;

  const loadUsers = () =>
    api
      .get('/users')
      .then((response) => {
        setData(
          response.data,
        );
      })
      .catch((error) => {
        console.error(
          'Error cargando usuarios:',
          error,
        );
      });

  useEffect(() => {
    void loadUsers();
  }, []);

  const currentRole = (
    item: any,
  ) =>
    item.roles?.[0]?.name ||
    'CONSULTOR';

  const resetCreateForm =
    () => {
      setCreateForm({
        name: '',
        email: '',
        position: '',
        roleName:
          'CONSULTOR',
        password: '',
      });

      setCreatePasswordMode(
        'AUTO',
      );

      setShowCreate(false);
    };

  const createUser = async (
    event:
      React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !createForm.name.trim() ||
      !createForm.email.trim()
    ) {
      alert(
        'Nombre y correo son obligatorios.',
      );
      return;
    }

    if (
      createPasswordMode ===
        'MANUAL' &&
      createForm.password.length <
        8
    ) {
      alert(
        'La contraseña temporal debe tener al menos 8 caracteres.',
      );
      return;
    }

    try {
      setCreating(true);
      setMessage('');

      const response =
        await api.post(
          '/users',
          {
            name:
              createForm.name.trim(),
            email:
              createForm.email.trim(),
            position:
              createForm.position.trim(),
            roleNames: [
              createForm.roleName,
            ],
            ...(createPasswordMode ===
            'MANUAL'
              ? {
                  password:
                    createForm.password,
                }
              : {}),
          },
        );

      const result =
        response.data;

      setTemporaryCredential({
        name:
          result.user?.name ||
          createForm.name,
        email:
          result.user?.email ||
          createForm.email,
        password:
          result.temporaryPassword,
        origin: 'CREATE',
      });

      await loadUsers();

      setMessage(
        `Usuario ${result.user?.email || createForm.email} creado correctamente.`,
      );

      resetCreateForm();
    } catch (error: any) {
      console.error(
        'Error creando usuario:',
        error,
      );

      alert(
        error?.response?.data
          ?.message ||
          'No se pudo crear el usuario.',
      );
    } finally {
      setCreating(false);
    }
  };

  const copyTemporaryPassword =
    async () => {
      if (
        !temporaryCredential
      ) {
        return;
      }

      try {
        await navigator.clipboard
          .writeText(
            temporaryCredential.password,
          );

        setMessage(
          'Contraseña temporal copiada al portapapeles.',
        );
      } catch {
        alert(
          'No se pudo copiar automáticamente. Seleccione la contraseña y cópiela manualmente.',
        );
      }
    };

  const resetPassword =
    async (item: any) => {
      if (
        item.id ===
        currentUserId
      ) {
        alert(
          'Para su propia cuenta utilice el cambio normal de contraseña.',
        );
        return;
      }

      const confirmed =
        window.confirm(
          `¿Generar una nueva contraseña temporal para ${item.name}? La contraseña anterior dejará de funcionar.`,
        );

      if (!confirmed) {
        return;
      }

      try {
        setSavingId(item.id);
        setMessage('');

        const response =
          await api.patch(
            `/users/${item.id}/reset-password`,
            {},
          );

        setTemporaryCredential({
          name: item.name,
          email:
            response.data
              .email ||
            item.email,
          password:
            response.data
              .temporaryPassword,
          origin: 'RESET',
        });

        setMessage(
          `Contraseña de ${item.name} restablecida. El usuario deberá cambiarla en su próximo ingreso.`,
        );
      } catch (error: any) {
        console.error(
          'Error restableciendo contraseña:',
          error,
        );

        alert(
          error?.response?.data
            ?.message ||
            'No se pudo restablecer la contraseña.',
        );
      } finally {
        setSavingId(null);
      }
    };

  const updateRole = async (
    item: any,
    roleName: string,
  ) => {
    if (
      item.id === currentUserId
    ) {
      alert(
        'Por seguridad no puede modificar su propio rol administrativo.',
      );
      return;
    }

    if (item.deletedAt) {
      return;
    }

    const previousRole =
      currentRole(item);

    const confirmed =
      window.confirm(
        `¿Cambiar el rol de ${item.name} de ${previousRole} a ${roleName}?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setSavingId(item.id);
      setMessage('');

      await api.patch(
        `/users/${item.id}`,
        {
          roleNames: [
            roleName,
          ],
        },
      );

      await loadUsers();

      setMessage(
        `Rol de ${item.name} actualizado a ${roleName}. El usuario deberá iniciar sesión nuevamente para recibir los nuevos permisos.`,
      );
    } catch (error: any) {
      console.error(
        'Error cambiando rol:',
        error,
      );

      alert(
        error?.response?.data
          ?.message ||
          'No se pudo cambiar el rol del usuario.',
      );
    } finally {
      setSavingId(null);
    }
  };

  const toggleActive =
    async (item: any) => {
      if (
        item.id ===
        currentUserId
      ) {
        alert(
          'Por seguridad no puede desactivar su propia cuenta.',
        );
        return;
      }

      if (item.deletedAt) {
        return;
      }

      const nextActive =
        !item.active;

      const confirmed =
        window.confirm(
          `¿${nextActive ? 'Activar' : 'Desactivar'} la cuenta de ${item.name}?`,
        );

      if (!confirmed) {
        return;
      }

      try {
        setSavingId(item.id);
        setMessage('');

        await api.patch(
          `/users/${item.id}`,
          {
            active:
              nextActive,
          },
        );

        await loadUsers();

        setMessage(
          `Cuenta de ${item.name} ${nextActive ? 'activada' : 'desactivada'}.`,
        );
      } catch (error: any) {
        console.error(
          'Error actualizando usuario:',
          error,
        );

        alert(
          error?.response?.data
            ?.message ||
            'No se pudo actualizar el usuario.',
        );
      } finally {
        setSavingId(null);
      }
    };

  const startEdit = (
    item: any,
  ) => {
    if (item.deletedAt) {
      return;
    }

    setEditing({
      id: item.id,
      name:
        item.name || '',
      email:
        item.email || '',
      position:
        item.position || '',
      active:
        Boolean(item.active),
    });
  };

  const saveProfile =
    async () => {
      if (!editing) {
        return;
      }

      if (
        !editing.name.trim() ||
        !editing.email.trim()
      ) {
        alert(
          'Nombre y correo son obligatorios.',
        );
        return;
      }

      try {
        setSavingId(
          editing.id,
        );

        await api.patch(
          `/users/${editing.id}`,
          {
            name:
              editing.name.trim(),
            email:
              editing.email.trim(),
            position:
              editing.position.trim(),
            active:
              editing.active,
          },
        );

        await loadUsers();

        setMessage(
          `Perfil de ${editing.name} actualizado correctamente.`,
        );

        setEditing(null);
      } catch (error: any) {
        console.error(
          'Error editando perfil:',
          error,
        );

        alert(
          error?.response?.data
            ?.message ||
            'No se pudo actualizar el perfil.',
        );
      } finally {
        setSavingId(null);
      }
    };

  const confirmDelete =
    async () => {
      if (!deleteTarget) {
        return;
      }

      if (
        deleteReason.trim()
          .length < 5
      ) {
        alert(
          'Indique un motivo de eliminación de al menos 5 caracteres.',
        );
        return;
      }

      try {
        setSavingId(
          deleteTarget.id,
        );

        await api.patch(
          `/users/${deleteTarget.id}/delete`,
          {
            reason:
              deleteReason.trim(),
          },
        );

        await loadUsers();

        setMessage(
          `Usuario ${deleteTarget.name} eliminado del sistema. El registro histórico se conserva.`,
        );

        setDeleteTarget(null);
        setDeleteReason('');
      } catch (error: any) {
        console.error(
          'Error eliminando usuario:',
          error,
        );

        alert(
          error?.response?.data
            ?.message ||
            'No se pudo eliminar el usuario.',
        );
      } finally {
        setSavingId(null);
      }
    };

  const restoreUser =
    async (item: any) => {
      const confirmed =
        window.confirm(
          `¿Restaurar la cuenta de ${item.name}?`,
        );

      if (!confirmed) {
        return;
      }

      try {
        setSavingId(item.id);

        await api.patch(
          `/users/${item.id}/restore`,
        );

        await loadUsers();

        setMessage(
          `Usuario ${item.name} restaurado correctamente.`,
        );
      } catch (error: any) {
        console.error(
          'Error restaurando usuario:',
          error,
        );

        alert(
          error?.response?.data
            ?.message ||
            'No se pudo restaurar el usuario.',
        );
      } finally {
        setSavingId(null);
      }
    };

  const roleDescription = (
    role: string,
  ) => {
    if (role === 'ADMIN') {
      return 'Control total, usuarios, auditoría y gestión de contenido.';
    }

    if (role === 'EDITOR') {
      return 'Gestiona contenido, procedimientos, formularios y correspondencia.';
    }

    return 'Consulta información y descarga recursos permitidos.';
  };

  return (
    <>
      <div className="titlebar">
        <div>
          <h1>
            Gestión de usuarios
          </h1>

          <p>
            Administración de perfiles, roles, accesos y trazabilidad de usuarios.
          </p>
        </div>

        <button
          type="button"
          className="btn"
          onClick={() =>
            setShowCreate(
              (value) =>
                !value,
            )
          }
        >
          {showCreate
            ? 'Cerrar formulario'
            : '+ Nuevo usuario'}
        </button>
      </div>

      <div className="user-role-summary">
        <Card>
          <b>Administrador</b>
          <p>
            Acceso completo al sistema y gestión de usuarios.
          </p>
        </Card>

        <Card>
          <b>Editor</b>
          <p>
            Puede crear y actualizar contenido institucional.
          </p>
        </Card>

        <Card>
          <b>Consultor</b>
          <p>
            Acceso de consulta a la información autorizada.
          </p>
        </Card>
      </div>

      {message && (
        <div
          className="user-management-message"
          role="status"
        >
          {message}
        </div>
      )}

      {temporaryCredential && (
        <Card>
          <div className="temporary-credential-card">
            <div className="temporary-credential-header">
              <div>
                <Badge tone="green">
                  {temporaryCredential.origin ===
                  'CREATE'
                    ? 'Usuario creado'
                    : 'Contraseña restablecida'}
                </Badge>

                <h2>
                  Credenciales temporales
                </h2>

                <p>
                  Copie esta contraseña ahora. No podrá consultarse nuevamente desde el sistema.
                </p>
              </div>

              <button
                type="button"
                className="btn secondary"
                onClick={() =>
                  setTemporaryCredential(
                    null,
                  )
                }
              >
                Cerrar
              </button>
            </div>

            <div className="temporary-credential-grid">
              <div>
                <span>
                  Usuario
                </span>
                <strong>
                  {temporaryCredential.name}
                </strong>
              </div>

              <div>
                <span>
                  Correo
                </span>
                <strong>
                  {temporaryCredential.email}
                </strong>
              </div>

              <div className="temporary-password-value">
                <span>
                  Contraseña temporal
                </span>

                <code>
                  {temporaryCredential.password}
                </code>
              </div>
            </div>

            <div className="temporary-credential-actions">
              <button
                type="button"
                className="btn"
                onClick={() =>
                  void copyTemporaryPassword()
                }
              >
                Copiar contraseña
              </button>
            </div>

            <small>
              El usuario deberá cambiar esta contraseña al iniciar sesión. El envío automático por correo quedará disponible cuando se configure el SMTP institucional.
            </small>
          </div>
        </Card>
      )}

      {showCreate && (
        <Card>
          <div className="user-edit-header">
            <div>
              <h2>
                Nuevo usuario
              </h2>

              <p>
                Cree una cuenta y asigne su rol inicial.
              </p>
            </div>

            <button
              type="button"
              className="btn secondary"
              onClick={
                resetCreateForm
              }
            >
              Cancelar
            </button>
          </div>

          <form
            className="form"
            onSubmit={
              createUser
            }
          >
            <label>
              Nombre completo
              <input
                required
                value={
                  createForm.name
                }
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    name:
                      e.target.value,
                  })
                }
              />
            </label>

            <label>
              Correo institucional
              <input
                required
                type="email"
                value={
                  createForm.email
                }
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    email:
                      e.target.value,
                  })
                }
                placeholder="usuario@itcr.ac.cr"
              />
            </label>

            <label>
              Puesto
              <input
                value={
                  createForm.position
                }
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    position:
                      e.target.value,
                  })
                }
              />
            </label>

            <label>
              Rol inicial
              <select
                value={
                  createForm.roleName
                }
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    roleName:
                      e.target.value,
                  })
                }
              >
                <option value="CONSULTOR">
                  Consultor
                </option>
                <option value="EDITOR">
                  Editor
                </option>
                <option value="ADMIN">
                  Administrador
                </option>
              </select>
            </label>

            <div className="full user-password-mode">
              <strong>
                Contraseña temporal
              </strong>

              <label>
                <input
                  type="radio"
                  name="passwordMode"
                  checked={
                    createPasswordMode ===
                    'AUTO'
                  }
                  onChange={() =>
                    setCreatePasswordMode(
                      'AUTO',
                    )
                  }
                />
                Generar automáticamente
              </label>

              <label>
                <input
                  type="radio"
                  name="passwordMode"
                  checked={
                    createPasswordMode ===
                    'MANUAL'
                  }
                  onChange={() =>
                    setCreatePasswordMode(
                      'MANUAL',
                    )
                  }
                />
                Escribir manualmente
              </label>
            </div>

            {createPasswordMode ===
              'MANUAL' && (
              <label className="full">
                Contraseña temporal
                <input
                  type="password"
                  minLength={8}
                  required
                  value={
                    createForm.password
                  }
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      password:
                        e.target.value,
                    })
                  }
                  placeholder="Mínimo 8 caracteres"
                />
              </label>
            )}

            <div className="full user-edit-actions">
              <button
                type="submit"
                className="btn"
                disabled={
                  creating
                }
              >
                {creating
                  ? 'Creando...'
                  : 'Crear usuario'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {editing && (
        <Card>
          <div className="user-edit-header">
            <div>
              <h2>
                Editar perfil
              </h2>
              <p>
                Corrija los datos institucionales del usuario.
              </p>
            </div>

            <button
              type="button"
              className="btn secondary"
              onClick={() =>
                setEditing(null)
              }
            >
              Cancelar
            </button>
          </div>

          <div className="form">
            <label>
              Nombre
              <input
                value={
                  editing.name
                }
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    name:
                      e.target.value,
                  })
                }
              />
            </label>

            <label>
              Correo institucional
              <input
                type="email"
                value={
                  editing.email
                }
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    email:
                      e.target.value,
                  })
                }
              />
            </label>

            <label>
              Puesto
              <input
                value={
                  editing.position
                }
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    position:
                      e.target.value,
                  })
                }
              />
            </label>

            <label>
              Estado
              <select
                value={
                  editing.active
                    ? 'ACTIVO'
                    : 'INACTIVO'
                }
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    active:
                      e.target
                        .value ===
                      'ACTIVO',
                  })
                }
              >
                <option value="ACTIVO">
                  Activo
                </option>
                <option value="INACTIVO">
                  Inactivo
                </option>
              </select>
            </label>

            <div className="full user-edit-actions">
              <button
                type="button"
                className="btn"
                disabled={
                  savingId ===
                  editing.id
                }
                onClick={() =>
                  void saveProfile()
                }
              >
                {savingId ===
                editing.id
                  ? 'Guardando...'
                  : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </Card>
      )}

      {deleteTarget && (
        <Card>
          <div className="user-delete-box">
            <h2>
              Eliminar usuario
            </h2>

            <p>
              Se retirará el acceso de <b>{deleteTarget.name}</b>, pero el registro se conservará para mantener la trazabilidad.
            </p>

            <label>
              Motivo de eliminación
              <textarea
                value={
                  deleteReason
                }
                onChange={(e) =>
                  setDeleteReason(
                    e.target.value,
                  )
                }
                placeholder="Ejemplo: usuario ya no pertenece al campus, cuenta duplicada, correo creado por error..."
              />
            </label>

            <div className="user-delete-actions">
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  setDeleteTarget(
                    null,
                  );
                  setDeleteReason(
                    '',
                  );
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn danger"
                disabled={
                  savingId ===
                  deleteTarget.id
                }
                onClick={() =>
                  void confirmDelete()
                }
              >
                {savingId ===
                deleteTarget.id
                  ? 'Eliminando...'
                  : 'Confirmar eliminación'}
              </button>
            </div>
          </div>
        </Card>
      )}

      <Card>
        {data.length ? (
          <table className="users-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Puesto</th>
                <th>Rol actual</th>
                <th>Permisos</th>
                <th>Estado</th>
                <th>Administrar</th>
              </tr>
            </thead>

            <tbody>
              {data.map(
                (item: any) => {
                  const role =
                    currentRole(
                      item,
                    );

                  const isCurrentUser =
                    item.id ===
                    currentUserId;

                  const saving =
                    savingId ===
                    item.id;

                  const deleted =
                    Boolean(
                      item.deletedAt,
                    );

                  return (
                    <tr
                      key={
                        item.id
                      }
                      className={
                        deleted
                          ? 'user-row-deleted'
                          : ''
                      }
                    >
                      <td>
                        <strong>
                          {item.name}
                        </strong>

                        <small>
                          {item.email}
                        </small>

                        {isCurrentUser && (
                          <span className="user-current-account">
                            Tu cuenta
                          </span>
                        )}

                        {item.mustChangePassword &&
                          !deleted && (
                          <span className="user-temp-password-label">
                            Contraseña temporal
                          </span>
                        )}

                        {deleted && (
                          <span className="user-deleted-label">
                            Eliminado
                          </span>
                        )}

                        {deleted &&
                          item.deletionReason && (
                          <small className="user-deletion-reason">
                            Motivo: {item.deletionReason}
                          </small>
                        )}
                      </td>

                      <td>
                        {item.position ||
                          '-'}
                      </td>

                      <td>
                        <Badge
                          tone={
                            role ===
                            'ADMIN'
                              ? 'blue'
                              : role ===
                                'EDITOR'
                              ? 'green'
                              : undefined
                          }
                        >
                          {role}
                        </Badge>
                      </td>

                      <td>
                        <small className="user-role-description">
                          {roleDescription(
                            role,
                          )}
                        </small>
                      </td>

                      <td>
                        <Badge
                          tone={
                            deleted
                              ? 'red'
                              : item.active
                              ? 'green'
                              : 'red'
                          }
                        >
                          {deleted
                            ? 'Eliminado'
                            : item.active
                            ? 'Activo'
                            : 'Inactivo'}
                        </Badge>
                      </td>

                      <td>
                        {deleted ? (
                          <button
                            type="button"
                            className="btn secondary"
                            disabled={
                              saving
                            }
                            onClick={() =>
                              void restoreUser(
                                item,
                              )
                            }
                          >
                            {saving
                              ? 'Restaurando...'
                              : 'Restaurar'}
                          </button>
                        ) : (
                          <div className="user-admin-actions">
                            <label>
                              <span>
                                Cambiar rol
                              </span>

                              <select
                                value={
                                  role
                                }
                                disabled={
                                  saving ||
                                  isCurrentUser
                                }
                                onChange={(
                                  e,
                                ) =>
                                  void updateRole(
                                    item,
                                    e.target
                                      .value,
                                  )
                                }
                              >
                                <option value="CONSULTOR">
                                  Consultor
                                </option>

                                <option value="EDITOR">
                                  Editor
                                </option>

                                <option value="ADMIN">
                                  Administrador
                                </option>
                              </select>
                            </label>

                            <button
                              type="button"
                              className="btn secondary"
                              disabled={
                                saving
                              }
                              onClick={() =>
                                startEdit(
                                  item,
                                )
                              }
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              className="btn secondary"
                              disabled={
                                saving ||
                                isCurrentUser
                              }
                              onClick={() =>
                                void resetPassword(
                                  item,
                                )
                              }
                            >
                              Restablecer contraseña
                            </button>

                            <button
                              type="button"
                              className="btn secondary"
                              disabled={
                                saving ||
                                isCurrentUser
                              }
                              onClick={() =>
                                void toggleActive(
                                  item,
                                )
                              }
                            >
                              {item.active
                                ? 'Desactivar'
                                : 'Activar'}
                            </button>

                            <button
                              type="button"
                              className="btn danger"
                              disabled={
                                saving ||
                                isCurrentUser
                              }
                              onClick={() => {
                                setDeleteTarget(
                                  item,
                                );
                                setDeleteReason(
                                  '',
                                );
                              }}
                            >
                              Eliminar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        ) : (
          <Empty text="No hay usuarios registrados." />
        )}
      </Card>

      <p className="user-role-note">
        Las contraseñas existentes nunca son visibles. Al crear o restablecer una cuenta, la contraseña temporal se muestra una sola vez y el usuario debe cambiarla al iniciar sesión. Todas las acciones administrativas quedan registradas en el historial.
      </p>
    </>
  );
}


/* =========================================================

   HISTORIAL / TRAZABILIDAD

\========================================================= */



export function Audit() {

  const { user } = useAuth();



  const isAdmin =

    user?.roles?.includes('ADMIN') ?? false;



  const [mode, setMode] = useState(

    isAdmin ? 'all' : 'mine'

  );



  const [d, setD] = useState<any[]>([]);



  useEffect(() => {

    api

      .get('/audit/' + mode)

      .then((r) => setD(r.data))

      .catch((error) => {

        console.error(

          'Error cargando historial:',

          error

        );

      });

  }, [mode]);



  return (

    <>

      <div className="titlebar">

        <div>

          <h1>Historial / Trazabilidad</h1>



          <p>

            Consulta las acciones realizadas en el sistema.

          </p>

        </div>



        {isAdmin && (

          <div>

            <Btn onClick={() => setMode('mine')}>

              Mi historial

            </Btn>



            {' '}



            <Btn onClick={() => setMode('all')}>

              Historial general

            </Btn>

          </div>

        )}

      </div>



      <Card>

        <table>

          <thead>

            <tr>

              <th>Fecha</th>

              <th>Usuario</th>

              <th>Acción</th>

              <th>Entidad</th>

              <th>Detalle</th>

            </tr>

          </thead>



          <tbody>

            {d.map((x) => (

              <tr key={x.id}>

                <td>

                  {x.createdAt

                    ? new Date(

                        x.createdAt

                      ).toLocaleString()

                    : '-'}

                </td>



                <td>{x.user?.name ?? '-'}</td>



                <td>{x.action}</td>



                <td>{x.entity}</td>



                <td>{x.detail}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </Card>

    </>

  );

}