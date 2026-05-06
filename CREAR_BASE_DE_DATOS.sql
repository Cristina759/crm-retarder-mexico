-- ============================================================
-- SCRIPT DE REPARACIÓN DE BASE DE DATOS - CRM Retarder México
-- ============================================================
-- IMPORTANTE: Copia TODO este texto y pégalo en el SQL Editor de Supabase
-- y dale al botón "Run" (Ejecutar).
-- Esto recreará las tablas perdidas que necesita el CRM para funcionar.

-- 1. EMPRESAS
CREATE TABLE IF NOT EXISTS empresas (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_comercial TEXT NOT NULL,
  rfc              TEXT,
  telefono         TEXT,
  email            TEXT,
  direccion        TEXT,
  razon_social     TEXT,
  sucursal         TEXT,
  ciudad           TEXT,
  estado           TEXT,
  cp               TEXT,
  persona_encargada TEXT,
  activo           BOOLEAN DEFAULT true,
  notas            TEXT,
  giro             TEXT,
  sitio_web        TEXT,
  direccion_fiscal TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- 2. USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
  id         UUID PRIMARY KEY,
  nombre     TEXT NOT NULL,
  email      TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'ventas',
  empresa_id UUID REFERENCES empresas(id),
  apellido       TEXT,
  avatar_url     TEXT,
  clerk_user_id  TEXT,
  telefono       TEXT,
  activo         BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. OPORTUNIDADES
CREATE TABLE IF NOT EXISTS oportunidades (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id   UUID REFERENCES empresas(id) NOT NULL,
  titulo       TEXT NOT NULL,
  estado       TEXT NOT NULL DEFAULT 'lead',
  probabilidad INT DEFAULT 50,
  monto        NUMERIC DEFAULT 0,
  vendedor_id  UUID REFERENCES usuarios(id),
  contacto_id  UUID,
  descripcion  TEXT,
  fecha_cierre_estimada DATE,
  monto_estimado NUMERIC,
  motivo_perdida TEXT,
  notas        TEXT,
  tipo         TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- 4. COTIZACIONES
CREATE TABLE IF NOT EXISTS cotizaciones (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  folio          TEXT NOT NULL UNIQUE,
  empresa_id     UUID REFERENCES empresas(id) NOT NULL,
  oportunidad_id UUID REFERENCES oportunidades(id),
  vendedor_id    UUID REFERENCES usuarios(id),
  tipo           TEXT NOT NULL DEFAULT 'frenos',
  estado         TEXT NOT NULL DEFAULT 'borrador',
  subtotal       NUMERIC DEFAULT 0,
  iva            NUMERIC DEFAULT 0,
  total_mxn      NUMERIC DEFAULT 0,
  pdf_url        TEXT,
  notas          TEXT,
  condiciones    TEXT,
  contacto_id    UUID,
  numero_cotizacion SERIAL,
  token_aprobacion  TEXT,
  total          NUMERIC,
  vigencia_dias  INT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- 5. ORDENES DE SERVICIO
CREATE TABLE IF NOT EXISTS ordenes_servicio (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero               TEXT NOT NULL UNIQUE,
  empresa_id           UUID REFERENCES empresas(id) NOT NULL,
  oportunidad_id       UUID REFERENCES oportunidades(id),
  cotizacion_id        UUID REFERENCES cotizaciones(id),
  tecnico_id           UUID REFERENCES usuarios(id),
  estado               TEXT NOT NULL DEFAULT 'solicitud_recibida',
  fase                 INT NOT NULL DEFAULT 1,
  descripcion_trabajo  TEXT,
  fecha_tentativa      DATE,
  fecha_inicio         TIMESTAMPTZ,
  fecha_fin            TIMESTAMPTZ,
  fotos_antes          JSONB DEFAULT '[]',
  fotos_despues        JSONB DEFAULT '[]',
  firma_tecnico        TEXT,
  firma_cliente        TEXT,
  encuesta_enviada     BOOLEAN DEFAULT false,
  factura_generada     BOOLEAN DEFAULT false,
  estado_facturacion   TEXT NOT NULL DEFAULT 'pendiente',
  monto_factura        NUMERIC,
  numero_factura       TEXT,
  concepto_factura     TEXT,
  fecha_vencimiento    DATE,
  notas                TEXT,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- 6. RECARGAR CACHÉ
NOTIFY pgrst, 'reload schema';
