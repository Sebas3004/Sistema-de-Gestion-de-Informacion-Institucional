import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth';

const VERSION = '1.0.0'; 

const SECTIONS = [
  'Documentos y correspondencia',
  'Procedimientos y formularios',
  'Noticias y enlaces a sistemas institucionales',
];

export function About() {
  const navigate = useNavigate();
  const auth = useAuth();

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(auth?.user ? '/' : '/login');
    }
  };

  return (
    <div className="login-page">
      <aside className="login-sidebar">
        <div className="login-sidebar-brand">
          <img className="login-sidebar-logo" src="/branding/logo-tec.svg" alt="TEC" />
          <p>Campus Tecnológico de San José</p>
          <button className="login-sidebar-active" onClick={goBack}>
            <span className="sidebar-home-icon">←</span>
            Volver
          </button>
        </div>
        <div className="login-sidebar-footer">
          <button onClick={() => navigate('/ayuda', { replace: true })}>
            <span>?</span>Ayuda
          </button>
          <button className="help-nav-active">
            <span>i</span>Acerca del sistema
          </button>
        </div>
      </aside>

      <main className="login-main">
        <div className="login-background-shape login-shape-1" />
        <div className="login-background-shape login-shape-2" />

        <div className="login-card help-card">
          <section className="login-form-section">
            <div className="login-heading">
              <h1>Acerca del sistema</h1>
              <p>
                Sistema de Gestión de Información Institucional del Campus
                Tecnológico de San José.
              </p>
            </div>

            <h3 className="about-subtitle">Desde aquí puedes consultar</h3>
            <ul className="about-list">
              {SECTIONS.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>

            <div className="about-row">
              <span>Institución</span>
              <strong>Campus Tecnológico de San José</strong>
            </div>
            <div className="about-row">
              <span>Versión</span>
              <strong>{VERSION}</strong>
            </div>
            <div className="about-row">
              <span>Soporte</span>
              <strong>Administrador del sistema</strong>
            </div>
          </section>

          <section className="help-contact">
            <h2>Conocimiento que conecta</h2>
            <div className="login-image-line" />
            <p>
              Un solo lugar para acceder a la información del campus, según tu
              rol.
            </p>

            <button className="help-back" onClick={goBack}>
              Volver
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}