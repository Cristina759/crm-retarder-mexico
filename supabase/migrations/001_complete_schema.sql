-- ============================================
-- CRM RETARDER MÉXICO — Complete Database Schema
-- Supabase PostgreSQL Migration
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================
CREATE TYPE rol_usuario AS ENUM ('admin', 'ventas', 'tecnico', 'facturacion', 'direccion', 'cliente');

CREATE TYPE ticket_estado AS ENUM (
  'solicitud_recibida',
  'cotizacion_enviada',
  'cotizacion_aceptada',
  'asignacion_tecnico',
  'servicio_programado',
  'documentacion_enviada',
  'tecnico_en_contacto',
  'servicio_en_proceso',
  'autorizacion_adicional',
  'servicio_concluido',
  'evidencia_cargada',
  'documentacion_entregada',
  'encuesta_enviada',
  'facturado',
  'pagado'
);

CREATE TYPE ticket_prioridad AS ENUM ('baja', 'media', 'alta', 'urgente');
CREATE TYPE tipo_servicio AS ENUM ('preventivo', 'correctivo', 'instalacion', 'diagnostico');
CREATE TYPE tipo_evidencia AS ENUM ('foto_antes', 'foto_despues', 'video', 'documento', 'firma');
CREATE TYPE oportunidad_estado AS ENUM ('prospecto', 'contactado', 'cotizado', 'negociacion', 'ganada', 'perdida');
CREATE TYPE oportunidad_tipo AS ENUM ('frenos', 'refacciones', 'servicios');
CREATE TYPE cotizacion_estado AS ENUM ('borrador', 'enviada', 'aceptada', 'rechazada', 'vencida');
CREATE TYPE cotizacion_item_tipo AS ENUM ('freno', 'refaccion', 'servicio');
CREATE TYPE condicion_pago AS ENUM ('contado', '15_dias', '30_dias', '45_dias', '60_dias');
CREATE TYPE recordatorio_tipo AS ENUM ('seguimiento_cotizacion', 'cobranza', 'alerta_pago', 'tarea');
CREATE TYPE audit_accion AS ENUM ('INSERT', 'UPDATE', 'DELETE');
CREATE TYPE producto_tipo AS ENUM ('freno', 'refaccion', 'insumo');
CREATE TYPE movimiento_tipo AS ENUM ('entrada', 'salida', 'ajuste');
CREATE TYPE movimiento_motivo AS ENUM ('compra', 'venta', 'servicio', 'devolucion', 'ajuste_manual');
CREATE TYPE refaccion_categoria AS ENUM ('cardan', 'cruceta', 'material_electrico', 'soporteria', 'hules', 'tornilleria', 'placas');

-- ============================================
-- TABLE: empresas (Clientes)
-- ============================================
CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  razon_social TEXT NOT NULL,
  nombre_comercial TEXT,
  rfc VARCHAR(13) UNIQUE,
  giro TEXT,
  direccion_fiscal TEXT,
  ciudad TEXT,
  estado TEXT,
  cp VARCHAR(5),
  telefono VARCHAR(15),
  email TEXT,
  sitio_web TEXT,
  condiciones_pago condicion_pago DEFAULT 'contado',
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: sucursales
-- ============================================
CREATE TABLE sucursales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  direccion TEXT,
  ciudad TEXT,
  estado TEXT,
  cp VARCHAR(5),
  telefono VARCHAR(15),
  contacto_principal TEXT,
  es_matriz BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sucursales_empresa ON sucursales(empresa_id);

-- ============================================
-- TABLE: usuarios
-- ============================================
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  apellido TEXT,
  email TEXT UNIQUE NOT NULL,
  rol rol_usuario NOT NULL DEFAULT 'cliente',
  empresa_id UUID REFERENCES empresas(id),
  avatar_url TEXT,
  telefono VARCHAR(15),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usuarios_clerk ON usuarios(clerk_user_id);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_usuarios_empresa ON usuarios(empresa_id);

-- ============================================
-- TABLE: contactos
-- ============================================
CREATE TABLE contactos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  sucursal_id UUID REFERENCES sucursales(id),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  puesto TEXT,
  email TEXT,
  telefono VARCHAR(15),
  celular VARCHAR(15),
  es_decisor BOOLEAN DEFAULT false,
  es_contacto_principal BOOLEAN DEFAULT false,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contactos_empresa ON contactos(empresa_id);

-- ============================================
-- CATALOGS
-- ============================================
CREATE TABLE cat_frenos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  modelo TEXT NOT NULL,
  descripcion TEXT,
  precio_lista DECIMAL(12,2) NOT NULL DEFAULT 0,
  especificaciones JSONB DEFAULT '{}',
  imagen_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cat_refacciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria refaccion_categoria NOT NULL,
  nombre TEXT NOT NULL,
  numero_parte VARCHAR(50),
  descripcion TEXT,
  precio_lista DECIMAL(12,2) NOT NULL DEFAULT 0,
  unidad TEXT DEFAULT 'pieza',
  stock_minimo INT DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cat_servicios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo tipo_servicio NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio_base DECIMAL(12,2) NOT NULL DEFAULT 0,
  duracion_estimada_hrs DECIMAL(5,2),
  requiere_equipo JSONB DEFAULT '[]',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: oportunidades
-- ============================================
CREATE TABLE oportunidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  contacto_id UUID REFERENCES contactos(id),
  vendedor_id UUID REFERENCES usuarios(id),
  tipo oportunidad_tipo NOT NULL,
  descripcion TEXT,
  estado oportunidad_estado DEFAULT 'prospecto',
  monto_estimado DECIMAL(12,2) DEFAULT 0,
  probabilidad INT DEFAULT 0 CHECK (probabilidad >= 0 AND probabilidad <= 100),
  fecha_cierre_estimada DATE,
  motivo_perdida TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_oportunidades_empresa ON oportunidades(empresa_id);
CREATE INDEX idx_oportunidades_vendedor ON oportunidades(vendedor_id);
CREATE INDEX idx_oportunidades_estado ON oportunidades(estado);

-- ============================================
-- TABLE: cotizaciones
-- ============================================
CREATE TABLE cotizaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_cotizacion SERIAL,
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  contacto_id UUID REFERENCES contactos(id),
  oportunidad_id UUID REFERENCES oportunidades(id),
  vendedor_id UUID REFERENCES usuarios(id),
  subtotal DECIMAL(12,2) DEFAULT 0,
  iva DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  estado cotizacion_estado DEFAULT 'borrador',
  vigencia_dias INT DEFAULT 15,
  condiciones TEXT,
  notas TEXT,
  token_aprobacion UUID DEFAULT uuid_generate_v4() UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cotizaciones_empresa ON cotizaciones(empresa_id);
CREATE INDEX idx_cotizaciones_estado ON cotizaciones(estado);

-- ============================================
-- TABLE: cotizacion_items
-- ============================================
CREATE TABLE cotizacion_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cotizacion_id UUID NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  tipo_item cotizacion_item_tipo NOT NULL,
  catalogo_id UUID,
  descripcion TEXT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,
  descuento_pct DECIMAL(5,2) DEFAULT 0,
  subtotal DECIMAL(12,2) GENERATED ALWAYS AS (
    cantidad * precio_unitario * (1 - descuento_pct / 100)
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cotizacion_items_cotizacion ON cotizacion_items(cotizacion_id);

-- ============================================
-- TABLE: tickets (CORE)
-- ============================================
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_ticket SERIAL UNIQUE,
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  contacto_id UUID REFERENCES contactos(id),
  sucursal_id UUID REFERENCES sucursales(id),
  tipo_servicio tipo_servicio NOT NULL,
  descripcion TEXT NOT NULL,
  estado ticket_estado DEFAULT 'solicitud_recibida',
  prioridad ticket_prioridad DEFAULT 'media',
  tecnico_id UUID REFERENCES usuarios(id),
  vendedor_id UUID REFERENCES usuarios(id),
  fecha_programada TIMESTAMPTZ,
  fecha_inicio_servicio TIMESTAMPTZ,
  fecha_fin_servicio TIMESTAMPTZ,
  cotizacion_id UUID REFERENCES cotizaciones(id),
  monto_facturado DECIMAL(12,2),
  numero_factura TEXT,
  fecha_factura DATE,
  fecha_pago DATE,
  metodo_pago TEXT,
  requiere_autorizacion BOOLEAN DEFAULT false,
  notas_internas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tickets_empresa ON tickets(empresa_id);
CREATE INDEX idx_tickets_estado ON tickets(estado);
CREATE INDEX idx_tickets_tecnico ON tickets(tecnico_id);
CREATE INDEX idx_tickets_vendedor ON tickets(vendedor_id);
CREATE INDEX idx_tickets_fecha_programada ON tickets(fecha_programada);

-- ============================================
-- TABLE: ticket_historial (Audit trail)
-- ============================================
CREATE TABLE ticket_historial (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  estado_anterior ticket_estado,
  estado_nuevo ticket_estado NOT NULL,
  usuario_id UUID REFERENCES usuarios(id),
  notas TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ticket_historial_ticket ON ticket_historial(ticket_id);

-- ============================================
-- TABLE: evidencias
-- ============================================
CREATE TABLE evidencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  tipo tipo_evidencia NOT NULL,
  archivo_url TEXT NOT NULL,
  descripcion TEXT,
  subido_por UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evidencias_ticket ON evidencias(ticket_id);

-- ============================================
-- TABLE: encuestas
-- ============================================
CREATE TABLE encuestas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) UNIQUE,
  contacto_id UUID REFERENCES contactos(id),
  calificacion_general INT CHECK (calificacion_general >= 1 AND calificacion_general <= 10),
  calificacion_tecnico INT CHECK (calificacion_tecnico >= 1 AND calificacion_tecnico <= 5),
  calificacion_tiempo INT CHECK (calificacion_tiempo >= 1 AND calificacion_tiempo <= 5),
  comentarios TEXT,
  respondida BOOLEAN DEFAULT false,
  token_acceso UUID DEFAULT uuid_generate_v4() UNIQUE,
  fecha_envio TIMESTAMPTZ DEFAULT NOW(),
  fecha_respuesta TIMESTAMPTZ
);

CREATE INDEX idx_encuestas_token ON encuestas(token_acceso);

-- ============================================
-- TABLE: recordatorios
-- ============================================
CREATE TABLE recordatorios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo recordatorio_tipo NOT NULL,
  referencia_id UUID,
  usuario_id UUID REFERENCES usuarios(id),
  fecha_recordatorio TIMESTAMPTZ NOT NULL,
  mensaje TEXT NOT NULL,
  completado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recordatorios_usuario ON recordatorios(usuario_id);
CREATE INDEX idx_recordatorios_fecha ON recordatorios(fecha_recordatorio);
CREATE INDEX idx_recordatorios_pendientes ON recordatorios(completado) WHERE completado = false;

-- ============================================
-- TABLE: inventario (NEW — Inventory Module)
-- ============================================
CREATE TABLE inventario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_tipo producto_tipo NOT NULL,
  freno_id UUID REFERENCES cat_frenos(id),
  refaccion_id UUID REFERENCES cat_refacciones(id),
  nombre VARCHAR(200) NOT NULL,
  codigo_interno VARCHAR(50),
  stock_actual INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 0,
  ubicacion VARCHAR(100),
  costo_unitario DECIMAL(12,2) DEFAULT 0,
  precio_venta DECIMAL(12,2) DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventario_tipo ON inventario(producto_tipo);
CREATE INDEX idx_inventario_codigo ON inventario(codigo_interno);
CREATE INDEX idx_inventario_stock_bajo ON inventario(stock_actual, stock_minimo) 
  WHERE stock_actual <= stock_minimo;

-- ============================================
-- TABLE: movimientos_inventario (NEW — Inventory Module)
-- ============================================
CREATE TABLE movimientos_inventario (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventario_id UUID NOT NULL REFERENCES inventario(id) ON DELETE CASCADE,
  tipo movimiento_tipo NOT NULL,
  cantidad INT NOT NULL,
  motivo movimiento_motivo NOT NULL,
  ticket_id UUID REFERENCES tickets(id),
  oportunidad_id UUID REFERENCES oportunidades(id),
  notas TEXT,
  created_by UUID REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_movimientos_inventario ON movimientos_inventario(inventario_id);
CREATE INDEX idx_movimientos_ticket ON movimientos_inventario(ticket_id);

-- ============================================
-- TABLE: audit_log (Global audit)
-- ============================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tabla TEXT NOT NULL,
  registro_id UUID NOT NULL,
  accion audit_accion NOT NULL,
  datos_anteriores JSONB,
  datos_nuevos JSONB,
  usuario_id UUID REFERENCES usuarios(id),
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_tabla ON audit_log(tabla, registro_id);
CREATE INDEX idx_audit_log_fecha ON audit_log(created_at);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'empresas', 'sucursales', 'usuarios', 'contactos',
    'cat_frenos', 'cat_refacciones', 'cat_servicios',
    'oportunidades', 'cotizaciones', 'tickets', 'inventario'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trigger_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Ticket status change → insert into historial
CREATE OR REPLACE FUNCTION log_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO ticket_historial (ticket_id, estado_anterior, estado_nuevo)
    VALUES (NEW.id, OLD.estado, NEW.estado);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ticket_status
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION log_ticket_status_change();

-- Inventory movement → auto-update stock
CREATE OR REPLACE FUNCTION update_stock_on_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo = 'entrada' THEN
    UPDATE inventario SET stock_actual = stock_actual + NEW.cantidad WHERE id = NEW.inventario_id;
  ELSIF NEW.tipo = 'salida' THEN
    UPDATE inventario SET stock_actual = stock_actual - NEW.cantidad WHERE id = NEW.inventario_id;
  ELSIF NEW.tipo = 'ajuste' THEN
    UPDATE inventario SET stock_actual = NEW.cantidad WHERE id = NEW.inventario_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_stock_movement
  AFTER INSERT ON movimientos_inventario
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_movement();

-- ============================================
-- SEED: Catálogos iniciales
-- ============================================

-- Frenos Retarder
INSERT INTO cat_frenos (modelo, descripcion, precio_lista) VALUES
  ('PK1',     'Retardador PK1 — Serie compacta', 0),
  ('PK',      'Retardador PK — Serie estándar', 0),
  ('P5-1',    'Retardador P5-1 — Media capacidad', 0),
  ('P5',      'Retardador P5 — Media capacidad plus', 0),
  ('P7-1',    'Retardador P7-1 — Alta capacidad', 0),
  ('P7',      'Retardador P7 — Alta capacidad plus', 0),
  ('P10',     'Retardador P10 — Extra capacidad', 0),
  ('F16-200', 'Retardador F16-200 — Máxima capacidad', 0);

-- Servicios base
INSERT INTO cat_servicios (tipo, nombre, descripcion, precio_base, duracion_estimada_hrs) VALUES
  ('preventivo',   'Servicio Preventivo',      'Revisión y mantenimiento preventivo de retardador',   0, 4),
  ('correctivo',   'Servicio Correctivo',       'Reparación y corrección de fallas en retardador',     0, 8),
  ('instalacion',  'Instalación de Retardador', 'Instalación completa de freno retarder en unidad',    0, 16),
  ('diagnostico',  'Diagnóstico Técnico',       'Evaluación y diagnóstico del estado del retardador',  0, 2);
