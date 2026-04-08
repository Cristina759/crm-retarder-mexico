-- ============================================
-- CRM RETARDER MÉXICO — Schema v2
-- supabase/migrations/001_schema.sql
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: usuarios
-- ============================================
CREATE TABLE usuarios (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id    TEXT UNIQUE NOT NULL,
  nombre      TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  rol         TEXT NOT NULL DEFAULT 'vendedor'
                CHECK (rol IN ('admin', 'vendedor', 'tecnico', 'facturacion', 'direccion')),
  activo      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: empresas
-- ============================================
CREATE TABLE empresas (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre_comercial TEXT NOT NULL,
  razon_social     TEXT,
  rfc              VARCHAR(13) UNIQUE,
  email            TEXT,
  telefono         VARCHAR(20),
  direccion        TEXT,
  activo           BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TABLE: cotizaciones
-- ============================================
CREATE TABLE cotizaciones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio       TEXT UNIQUE NOT NULL,
  tipo        TEXT NOT NULL DEFAULT 'frenos'
                CHECK (tipo IN ('frenos', 'refacciones', 'servicios')),
  empresa_id  UUID NOT NULL REFERENCES empresas(id),
  vendedor_id UUID REFERENCES usuarios(id),
  estado      TEXT NOT NULL DEFAULT 'borrador'
                CHECK (estado IN ('borrador', 'enviada', 'aceptada', 'rechazada', 'vencida')),
  items       JSONB NOT NULL DEFAULT '[]',
  subtotal    DECIMAL(14,2) NOT NULL DEFAULT 0,
  iva         DECIMAL(14,2) NOT NULL DEFAULT 0,
  total_usd   DECIMAL(14,2) NOT NULL DEFAULT 0,
  tipo_cambio DECIMAL(10,4) NOT NULL DEFAULT 1,
  total_mxn   DECIMAL(14,2) NOT NULL DEFAULT 0,
  notas       TEXT,
  pdf_url     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cotizaciones_empresa  ON cotizaciones(empresa_id);
CREATE INDEX idx_cotizaciones_vendedor ON cotizaciones(vendedor_id);
CREATE INDEX idx_cotizaciones_estado   ON cotizaciones(estado);

-- ============================================
-- TABLE: oportunidades
-- ============================================
CREATE TABLE oportunidades (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio          TEXT UNIQUE NOT NULL,
  empresa_id     UUID NOT NULL REFERENCES empresas(id),
  vendedor_id    UUID REFERENCES usuarios(id),
  estado         TEXT NOT NULL DEFAULT 'prospecto'
                   CHECK (estado IN (
                     'prospecto', 'cotizacion_enviada', 'seguimiento',
                     'negociacion', 'ganado', 'perdido'
                   )),
  fuente         TEXT,
  monto          DECIMAL(14,2) DEFAULT 0,
  descripcion    TEXT,
  motivo_perdida TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_oportunidades_empresa  ON oportunidades(empresa_id);
CREATE INDEX idx_oportunidades_vendedor ON oportunidades(vendedor_id);
CREATE INDEX idx_oportunidades_estado   ON oportunidades(estado);

-- ============================================
-- TABLE: ordenes_servicio
-- ============================================
CREATE TABLE ordenes_servicio (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_orden_fisica  TEXT,
  numero_orden_compra  TEXT,
  foto_os_url          TEXT,
  foto_oc_url          TEXT,
  empresa_id           UUID NOT NULL REFERENCES empresas(id),
  tipo                 TEXT NOT NULL DEFAULT 'correctivo'
                         CHECK (tipo IN ('preventivo', 'correctivo', 'instalacion', 'diagnostico')),
  estado               TEXT NOT NULL DEFAULT 'cotizacion_enviada_al_cliente'
                         CHECK (estado IN (
                           'cotizacion_enviada_al_cliente',
                           'cotizacion_aceptada',
                           'asignacion_tecnico',
                           'servicio_programado',
                           'tecnico_en_contacto',
                           'servicio_en_proceso',
                           'autorizacion_adicional',
                           'servicio_concluido',
                           'evidencia_cargada',
                           'documentacion_entregada',
                           'encuesta_enviada',
                           'facturado',
                           'pagado'
                         )),
  prioridad            TEXT NOT NULL DEFAULT 'media'
                         CHECK (prioridad IN ('baja', 'media', 'alta', 'urgente')),
  vendedor_id          UUID REFERENCES usuarios(id),
  tecnico_id           UUID REFERENCES usuarios(id),
  total_mxn            DECIMAL(14,2) DEFAULT 0,
  cotizacion_id        UUID REFERENCES cotizaciones(id),
  archivada            BOOLEAN NOT NULL DEFAULT false,
  notas                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_os_empresa   ON ordenes_servicio(empresa_id);
CREATE INDEX idx_os_vendedor  ON ordenes_servicio(vendedor_id);
CREATE INDEX idx_os_tecnico   ON ordenes_servicio(tecnico_id);
CREATE INDEX idx_os_estado    ON ordenes_servicio(estado);
CREATE INDEX idx_os_archivada ON ordenes_servicio(archivada);

-- ============================================
-- TABLE: orden_historial
-- ============================================
CREATE TABLE orden_historial (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orden_id        UUID NOT NULL REFERENCES ordenes_servicio(id) ON DELETE CASCADE,
  estado_anterior TEXT,
  estado_nuevo    TEXT NOT NULL,
  usuario_id      UUID REFERENCES usuarios(id),
  nota            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orden_historial_orden ON orden_historial(orden_id);

-- ============================================
-- TABLE: evidencias
-- ============================================
CREATE TABLE evidencias (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orden_id   UUID NOT NULL REFERENCES ordenes_servicio(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  tipo       TEXT NOT NULL DEFAULT 'foto'
               CHECK (tipo IN ('foto_antes', 'foto_despues', 'video', 'documento')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evidencias_orden ON evidencias(orden_id);

-- ============================================
-- TABLE: encuestas
-- ============================================
CREATE TABLE encuestas (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orden_id      UUID NOT NULL UNIQUE REFERENCES ordenes_servicio(id) ON DELETE CASCADE,
  token         UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  respondida    BOOLEAN NOT NULL DEFAULT false,
  respuestas    JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  respondida_at TIMESTAMPTZ
);

CREATE INDEX idx_encuestas_token ON encuestas(token);

-- ============================================
-- TABLE: firmas
-- ============================================
CREATE TABLE firmas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orden_id        UUID NOT NULL REFERENCES ordenes_servicio(id) ON DELETE CASCADE,
  token           UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  tipo            TEXT NOT NULL DEFAULT 'cliente'
                    CHECK (tipo IN ('cliente', 'tecnico')),
  firmado         BOOLEAN NOT NULL DEFAULT false,
  firma_url       TEXT,
  firmante_nombre TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_firmas_orden ON firmas(orden_id);
CREATE INDEX idx_firmas_token ON firmas(token);

-- ============================================
-- TRIGGER: updated_at automático
-- ============================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_empresas_updated_at
  BEFORE UPDATE ON empresas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_cotizaciones_updated_at
  BEFORE UPDATE ON cotizaciones
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_oportunidades_updated_at
  BEFORE UPDATE ON oportunidades
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_ordenes_updated_at
  BEFORE UPDATE ON ordenes_servicio
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
