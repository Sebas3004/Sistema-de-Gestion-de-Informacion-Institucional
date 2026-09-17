import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from './api';
import { Badge, Btn, Card, Empty } from './components';
import { useAuth } from './auth';


/* =========================================================
   LOGIN
========================================================= */

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState('admin@itcr.ac.cr');
  const [password, setPassword] = useState('Admin123!');
  const [err, setErr] = useState('');

  const go = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(email, password);
      nav('/');
    } catch {
      setErr('Credenciales inválidas');
    }
  };

  return (
    <div className="login">
      <div className="loginBox">
        <h1>
          TEC <span>Tecnológico de Costa Rica</span>
        </h1>

        <h2>Campus Tecnológico de San José</h2>

        <h3>Sistema de Gestión de Información Institucional</h3>

        <p>
          Accede a documentos, correspondencia, procedimientos,
          formularios, noticias y servicios institucionales.
        </p>

        <form onSubmit={go}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo institucional"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
          />

          {err && <p className="error">{err}</p>}

          <button type="submit">Iniciar sesión</button>
        </form>
      </div>

      <div className="hero">
        <div>
          <h2>Campus San José</h2>
          <p>Conocimiento que conecta</p>
        </div>
      </div>
    </div>
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

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
========================================================= */

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
========================================================= */

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
========================================================= */

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
========================================================= */

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

export function Repository() {
  return (
    <>
      <h1>Repositorio documental</h1>

      <p>
        Documentos institucionales de consulta del Campus
        Tecnológico de San José.
      </p>

      <SimpleTable
        endpoint="/repository"
        columns={[
          {
            k: 'name',
            l: 'Nombre',
          },
          {
            k: 'type',
            l: 'Tipo',
          },
          {
            k: 'category',
            l: 'Categoría',
          },
          {
            k: 'responsible',
            l: 'Responsable',
            render: (x: any) =>
              x.responsible?.name ?? '-',
          },
          {
            k: 'status',
            l: 'Estado',
          },
        ]}
      />
    </>
  );
}


/* =========================================================
   PROCEDIMIENTOS
========================================================= */

export function Procedures() {
  const [d, setD] = useState<any[]>([]);

  useEffect(() => {
    api
      .get('/procedures')
      .then((r) => setD(r.data))
      .catch((error) => {
        console.error(
          'Error cargando procedimientos:',
          error
        );
      });
  }, []);

  return (
    <>
      <h1>Procedimientos</h1>

      <p>
        Consulta el paso a paso de los procesos institucionales.
      </p>

      <Card>
        {d.map((x) => (
          <div className="procedure" key={x.id}>
            <div>
              <h3>{x.name}</h3>

              <p>{x.description}</p>

              <small>{x.responsibleArea}</small>
            </div>

            <Link
              className="btn secondary"
              to={`/procedimientos/${x.id}`}
            >
              Ver procedimiento
            </Link>
          </div>
        ))}
      </Card>
    </>
  );
}


/* =========================================================
   DETALLE PROCEDIMIENTO
========================================================= */

export function ProcedureDetail() {
  const { id } = useParams();

  const [x, setX] = useState<any>();

  useEffect(() => {
    api
      .get('/procedures/' + id)
      .then((r) => setX(r.data))
      .catch((error) => {
        console.error(
          'Error cargando procedimiento:',
          error
        );
      });
  }, [id]);

  if (!x) {
    return <Empty text="Cargando..." />;
  }

  const steps = Array.isArray(x.steps)
    ? [...x.steps].sort(
        (a: any, b: any) =>
          a.stepOrder - b.stepOrder
      )
    : [];

  return (
    <>
      <h1>{x.name}</h1>

      <p>{x.responsibleArea}</p>

      <div className="grid2">
        <Card>
          <h2>Descripción general</h2>

          <p>{x.description}</p>

          <h2>Requisitos</h2>

          {x.requirements?.length ? (
            x.requirements.map((r: string) => (
              <div className="check" key={r}>
                ✓ {r}
              </div>
            ))
          ) : (
            <p>No se registraron requisitos.</p>
          )}

          <h2>Formularios relacionados</h2>

          {x.relatedForms?.length ? (
            x.relatedForms.map((f: any) => (
              <div className="row" key={f.label}>
                {f.label}
              </div>
            ))
          ) : (
            <p>No hay formularios relacionados.</p>
          )}
        </Card>

        <Card>
          <h2>Pasos del procedimiento</h2>

          {steps.length ? (
            steps.map((s: any) => (
              <div className="step" key={s.id}>
                <b>
                  {s.stepOrder}. {s.title}
                </b>

                <p>{s.description}</p>
              </div>
            ))
          ) : (
            <p>No hay pasos registrados.</p>
          )}

          <h2>Enlaces útiles</h2>

          {x.links?.length ? (
            x.links.map((l: any) => (
              <a
                className="row"
                href={l.url}
                target="_blank"
                rel="noreferrer"
                key={l.label}
              >
                {l.label}
              </a>
            ))
          ) : (
            <p>No hay enlaces registrados.</p>
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
  return (
    <>
      <h1>Formularios</h1>

      <p>
        Consulta y descarga formularios institucionales.
      </p>

      <SimpleTable
        endpoint="/forms"
        columns={[
          {
            k: 'name',
            l: 'Nombre',
          },
          {
            k: 'description',
            l: 'Descripción',
          },
          {
            k: 'category',
            l: 'Categoría',
          },
          {
            k: 'format',
            l: 'Formato',
          },
          {
            k: 'createdBy',
            l: 'Agregado por',
            render: (x: any) =>
              x.createdBy?.name ?? '-',
          },
          {
            k: 'updatedAt',
            l: 'Última actualización',
            render: (x: any) =>
              x.updatedAt
                ? new Date(
                    x.updatedAt
                  ).toLocaleDateString()
                : '-',
          },
          {
            k: 'updatedBy',
            l: 'Actualizado por',
            render: (x: any) =>
              x.updatedBy?.name ?? '-',
          },
        ]}
      />
    </>
  );
}


/* =========================================================
   ENLACES
========================================================= */

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
========================================================= */

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
========================================================= */

export function Users() {
  return (
    <>
      <h1>Gestión de usuarios</h1>

      <p>
        Administración de usuarios, roles y permisos del sistema.
      </p>

      <SimpleTable
        endpoint="/users"
        columns={[
          {
            k: 'name',
            l: 'Nombre',
          },
          {
            k: 'email',
            l: 'Correo',
          },
          {
            k: 'position',
            l: 'Puesto',
          },
          {
            k: 'roles',
            l: 'Rol',
            render: (x: any) =>
              x.roles
                ?.map((r: any) => r.name)
                .join(', ') ?? '-',
          },
          {
            k: 'active',
            l: 'Estado',
            render: (x: any) =>
              x.active ? 'Activo' : 'Inactivo',
          },
        ]}
      />
    </>
  );
}


/* =========================================================
   HISTORIAL / TRAZABILIDAD
========================================================= */

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