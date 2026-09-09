-- =====================================================================
-- Sistema de Gestión de Información Pública — Campus San José, TEC
-- Script de creación de base de datos (PostgreSQL)
-- Basado en el diagrama entidad-relación final del proyecto
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto; 

-- =====================================================================
-- 1. USUARIO
-- =====================================================================
CREATE TABLE usuario (
    id_usuario           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre               VARCHAR(150) NOT NULL,
    correo_institucional VARCHAR(150) NOT NULL UNIQUE
        CHECK (correo_institucional ~ '^[a-zA-Z0-9._%+-]+@(estudiantec|itcr)\.ac\.cr$'),
    puesto               VARCHAR(100),
    rol                  VARCHAR(20)  NOT NULL
        CHECK (rol IN ('Administrador', 'Editor', 'Consultor')),
    estado               VARCHAR(20)  NOT NULL DEFAULT 'Activo'
        CHECK (estado IN ('Activo', 'Inactivo'))
);

CREATE INDEX idx_usuario_correo ON usuario (correo_institucional);
CREATE INDEX idx_usuario_rol    ON usuario (rol);

-- =====================================================================
-- 2. CORRESPONDENCIA
-- =====================================================================
CREATE TABLE correspondencia (
    id_correspondencia    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_referencia     VARCHAR(30) NOT NULL UNIQUE,   -- ej. COR-2025-184
    asunto                VARCHAR(200) NOT NULL,
    tipo                  VARCHAR(50) NOT NULL,          -- ej. Memo, Solicitud, Informe, Minuta
    id_usuario_envia      UUID NOT NULL REFERENCES usuario (id_usuario),
    id_usuario_responsable UUID NOT NULL REFERENCES usuario (id_usuario),
    fecha_limite          DATE,
    estado                VARCHAR(20) NOT NULL DEFAULT 'Pendiente'
        CHECK (estado IN ('Pendiente', 'En revisión', 'Respondido', 'Vencido'))
);

CREATE INDEX idx_correspondencia_envia      ON correspondencia (id_usuario_envia);
CREATE INDEX idx_correspondencia_responsable ON correspondencia (id_usuario_responsable);
CREATE INDEX idx_correspondencia_estado     ON correspondencia (estado);

-- =====================================================================
-- 3. DOCUMENTO
-- =====================================================================
CREATE TABLE documento (
    id_documento      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre            VARCHAR(200) NOT NULL,
    descripcion       TEXT,
    tipo              VARCHAR(50) NOT NULL
        CHECK (tipo IN ('Reglamento', 'Gaceta', 'Manual', 'Política', 'Guía', 'Calendario', 'Otro')),
    id_responsable    UUID NOT NULL REFERENCES usuario (id_usuario),
    fecha_publicacion DATE,
    estado            VARCHAR(20) NOT NULL DEFAULT 'Vigente'
        CHECK (estado IN ('Vigente', 'En revisión')),
    ruta_archivo      VARCHAR(500) NOT NULL,  -- referencia al archivo, no el binario
    version           VARCHAR(20)
);

CREATE INDEX idx_documento_responsable ON documento (id_responsable);
CREATE INDEX idx_documento_tipo        ON documento (tipo);
CREATE INDEX idx_documento_estado      ON documento (estado);

-- =====================================================================
-- 4. PROCEDIMIENTO
-- =====================================================================
CREATE TABLE procedimiento (
    id_procedimiento UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre           VARCHAR(200) NOT NULL,
    descripcion      TEXT,
    area_responsable VARCHAR(150),
    estado           VARCHAR(20) NOT NULL DEFAULT 'Activo'
        CHECK (estado IN ('Activo', 'En revisión')),
    id_usuario       UUID NOT NULL REFERENCES usuario (id_usuario)  
);

CREATE INDEX idx_procedimiento_usuario ON procedimiento (id_usuario);
CREATE INDEX idx_procedimiento_estado  ON procedimiento (estado);

-- =====================================================================
-- 5. FORMULARIO
-- =====================================================================
CREATE TABLE formulario (
    id_formulario       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre              VARCHAR(200) NOT NULL,
    descripcion         TEXT,
    categoria           VARCHAR(100),
    formato             VARCHAR(10) NOT NULL,   -- ej. PDF, DOCX
    fecha_actualizacion DATE,
    ruta_archivo        VARCHAR(500) NOT NULL,
    id_responsable      UUID NOT NULL REFERENCES usuario (id_usuario)
);

CREATE INDEX idx_formulario_responsable ON formulario (id_responsable);
CREATE INDEX idx_formulario_categoria   ON formulario (categoria);

-- =====================================================================
-- 6. ENLACE_SISTEMA
-- =====================================================================
CREATE TABLE enlace_sistema (
    id_enlace   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre      VARCHAR(150) NOT NULL,
    descripcion TEXT,
    url         VARCHAR(500) NOT NULL,
    icono       VARCHAR(100)
);

-- =====================================================================
-- 7. NOTICIA
-- =====================================================================
CREATE TABLE noticia (
    id_noticia        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo            VARCHAR(200) NOT NULL,
    descripcion           VARCHAR(500),
    categoria         VARCHAR(50)
        CHECK (categoria IN ('Campus', 'Académico', 'Administrativo', 'Eventos', 'Mantenimiento')),
    id_autor          UUID NOT NULL REFERENCES usuario (id_usuario),
    fecha_publicacion DATE NOT NULL DEFAULT CURRENT_DATE,
    imagen_url        VARCHAR(500)
);

CREATE INDEX idx_noticia_autor     ON noticia (id_autor);
CREATE INDEX idx_noticia_categoria ON noticia (categoria);

-- =====================================================================
-- 8. HISTORIAL_CAMBIO (trazabilidad polimórfica)
-- =====================================================================
CREATE TABLE historial_cambio (
    id_historial UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidad_tipo VARCHAR(30) NOT NULL
        CHECK (entidad_tipo IN
            ('Documento', 'Formulario', 'Procedimiento', 'Noticia',
             'Correspondencia', 'Usuario', 'Sistema')),
    id_entidad   UUID,                       -- id de la fila afectada (no es FK real: es polimórfico)
    id_usuario   UUID NOT NULL REFERENCES usuario (id_usuario),
    accion       VARCHAR(30) NOT NULL
        CHECK (accion IN
            ('Creación', 'Actualización', 'Descarga', 'Publicación', 'Inicio de sesión', 'Eliminación')),
    fecha        TIMESTAMPTZ NOT NULL DEFAULT now(),
    detalle      TEXT
);

CREATE INDEX idx_historial_usuario      ON historial_cambio (id_usuario);
CREATE INDEX idx_historial_entidad      ON historial_cambio (entidad_tipo, id_entidad);
CREATE INDEX idx_historial_fecha        ON historial_cambio (fecha);

-- =====================================================================
-- Tablas de unión (relaciones muchos a muchos)
-- =====================================================================

-- PROCEDIMIENTO <-> DOCUMENTO
CREATE TABLE procedimiento_documento (
    id_procedimiento UUID NOT NULL REFERENCES procedimiento (id_procedimiento) ON DELETE CASCADE,
    id_documento     UUID NOT NULL REFERENCES documento (id_documento) ON DELETE CASCADE,
    PRIMARY KEY (id_procedimiento, id_documento)
);

-- PROCEDIMIENTO <-> FORMULARIO
CREATE TABLE procedimiento_formulario (
    id_procedimiento UUID NOT NULL REFERENCES procedimiento (id_procedimiento) ON DELETE CASCADE,
    id_formulario    UUID NOT NULL REFERENCES formulario (id_formulario) ON DELETE CASCADE,
    PRIMARY KEY (id_procedimiento, id_formulario)
);

-- PROCEDIMIENTO <-> ENLACE_SISTEMA
CREATE TABLE procedimiento_enlace_sistema (
    id_procedimiento UUID NOT NULL REFERENCES procedimiento (id_procedimiento) ON DELETE CASCADE,
    id_enlace        UUID NOT NULL REFERENCES enlace_sistema (id_enlace) ON DELETE CASCADE,
    PRIMARY KEY (id_procedimiento, id_enlace)
);

-- NOTICIA <-> DOCUMENTO
CREATE TABLE noticia_documento (
    id_noticia   UUID NOT NULL REFERENCES noticia (id_noticia) ON DELETE CASCADE,
    id_documento UUID NOT NULL REFERENCES documento (id_documento) ON DELETE CASCADE,
    PRIMARY KEY (id_noticia, id_documento)
);
