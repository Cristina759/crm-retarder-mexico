-- ============================================================
-- CRM Retarder México v2 — Schema limpio
-- ============================================================

-- EMPRESAS
CREATE TABLE empresas (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_comercial TEXT NOT NULL,
  rfc              TEXT,
  telefono         TEXT,
  email            TEXT,
  direccion        TEXT,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- USUARIOS (sync con Clerk)
CREATE TABLE usuarios (
  id         UUID PRIMARY KEY, -- clerk user id
  nombre     TEXT NOT NULL,
  email      TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'ventas',
  empresa_id UUID REFERENCES empresas(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- OPORTUNIDADES
CREATE TABLE oportunidades (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id   UUID REFERENCES empresas(id) NOT NULL,
  titulo       TEXT NOT NULL,
  estado       TEXT NOT NULL DEFAULT 'lead',
  probabilidad INT DEFAULT 50,
  monto        NUMERIC DEFAULT 0,
  vendedor_id  UUID REFERENCES usuarios(id),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT oportunidades_estado_check CHECK (estado IN (
    'lead',
    'calificacion',
    'cotizacion_enviada',
    'seguimiento_activo',
    'negociacion_cierre',
    'ganado',
    'perdido'
  ))
);

-- COTIZACIONES
CREATE TABLE cotizaciones (
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
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- ORDENES DE SERVICIO
CREATE TABLE ordenes_servicio (
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
  notas                TEXT,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT os_estado_check CHECK (estado IN (
    'solicitud_recibida',
    'cotizacion_generada',
    'cotizacion_enviada',
    'orden_confirmada',
    'tecnico_asignado',
    'documentacion_permisos',
    'tecnico_notificado',
    'fotos_antes_cargadas',
    'servicio_en_proceso',
    'prueba_de_campo',
    'firmas_completadas',
    'fotos_despues_cargadas',
    'encuesta_factura'
  ))
);

-- ── Índices ──────────────────────────────────────────────────
CREATE INDEX idx_oportunidades_empresa  ON oportunidades(empresa_id);
CREATE INDEX idx_oportunidades_estado   ON oportunidades(estado);
CREATE INDEX idx_oportunidades_vendedor ON oportunidades(vendedor_id);

CREATE INDEX idx_cotizaciones_empresa   ON cotizaciones(empresa_id);
CREATE INDEX idx_cotizaciones_estado    ON cotizaciones(estado);

CREATE INDEX idx_os_empresa  ON ordenes_servicio(empresa_id);
CREATE INDEX idx_os_estado   ON ordenes_servicio(estado);
CREATE INDEX idx_os_tecnico  ON ordenes_servicio(tecnico_id);

-- ── updated_at automático ────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_empresas_updated_at
  BEFORE UPDATE ON empresas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_oportunidades_updated_at
  BEFORE UPDATE ON oportunidades
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_cotizaciones_updated_at
  BEFORE UPDATE ON cotizaciones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_os_updated_at
  BEFORE UPDATE ON ordenes_servicio
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS (Row Level Security) — permisivo para service_role ───
ALTER TABLE empresas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios         ENABLE ROW LEVEL SECURITY;
ALTER TABLE oportunidades    ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_servicio ENABLE ROW LEVEL SECURITY;

-- Política abierta para service_role (usado por supabaseAdmin)
CREATE POLICY "service_role_all" ON empresas         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON usuarios         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON oportunidades    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON cotizaciones     FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON ordenes_servicio FOR ALL TO service_role USING (true) WITH CHECK (true);
