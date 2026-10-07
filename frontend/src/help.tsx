import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './auth';

const SUPPORT_EMAIL = 'soporte@itcr.ac.cr'; // ⚠️ cámbialo por el correo real
const SUPPORT_HOURS = 'Lunes a viernes, 8:00 a.m. a 4:00 p.m.'; // ⚠️ ajusta el horario

const FAQ = [
  {
    q: '¿Cómo inicio sesión?',
    a: 'Escribe tu correo institucional y tu contraseña, y presiona Iniciar sesión.',
  },
  {
    q: '¿Qué hago si olvidé mi contraseña?',
    a: 'Comunícate con el administrador del sistema para que te ayude a recuperar el acceso.',
  },
  {
    q: '¿Qué puedo consultar en el sistema?',
    a: 'Documentos, correspondencia, procedimientos, formularios, noticias y servicios institucionales del campus, según tu rol.',
  },
  {
    q: '¿Por qué no puedo ver una sección?',
    a: 'Cada sección depende de tu rol (administrador, editor o consultor). Si necesitas más permisos, solicítalos al administrador.',
  },
  {
    q: '¿Cómo puedo cambiar mi contraseña?',
    a: 'Ve a la sección "Cambiar contraseña" en el menú de usuario y sigue las instrucciones.',
  },
  {
    q: '¿Cómo puedo cerrar sesión?',
    a: 'Haz clic en "Cerrar sesión" en la parte inferior del menú lateral.',
  },
];

export function Help() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [open, setOpen] = useState(0);
  
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
          <button className="help-nav-active">
            <span>?</span>Ayuda
          </button>
          <button onClick={() => navigate('/acerca', { replace: true })}>
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
              <h1>Centro de ayuda</h1>
              <p>
                Encuentra respuestas sobre el acceso y el uso del Sistema de Gestión
                de Información Institucional.
              </p>
            </div>

            <div className="help-faq">
              {FAQ.map((item, i) => (
                <div key={item.q} className={`help-item ${open === i ? 'open' : ''}`}>
                  <button onClick={() => setOpen(open === i ? -1 : i)}>
                    <span>{item.q}</span>
                    <b>{open === i ? '–' : '+'}</b>
                  </button>
                  {open === i && <p>{item.a}</p>}
                </div>
              ))}
            </div>
          </section>

          <section className="help-contact">
            <h2>¿Necesitas más ayuda?</h2>
            <div className="login-image-line" />
            <p>Si no encuentras tu respuesta, comunícate con el administrador del sistema.</p>

            <div className="help-contact-box">
              <span>Correo de soporte</span>
              <strong>{SUPPORT_EMAIL}</strong>
            </div>
            <div className="help-contact-box">
              <span>Horario de atención</span>
              <strong>{SUPPORT_HOURS}</strong>
            </div>

            <button className="help-back" onClick={goBack}>
              Volver
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}