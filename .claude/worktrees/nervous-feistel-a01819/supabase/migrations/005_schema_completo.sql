-- ── Migración 005: Schema completo — sincroniza migraciones con el estado real de la DB ──
-- Todas las operaciones son idempotentes (IF NOT EXISTS / DO ... EXCEPTION).

-- ════════════════════════════════════════════════════════════════
-- 1. ENUMS
-- ════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE audit_accion AS ENUM ('INSERT', 'UPDATE', 'DELETE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE condicion_pago AS ENUM ('contado', '15_dias', '30_dias', '45_dias', '60_dias');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE cotizacion_estado AS ENUM ('borrador', 'enviada', 'aceptada', 'rechazada', 'vencida');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE cotizacion_item_tipo AS ENUM ('freno', 'refaccion', 'servicio');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE movimiento_motivo AS ENUM ('compra', 'venta', 'servicio', 'devolucion', 'ajuste_manual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE movimiento_tipo AS ENUM ('entrada', 'salida', 'ajuste');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE oportunidad_tipo AS ENUM ('frenos', 'refacciones', 'servicios');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE producto_tipo AS ENUM ('freno', 'refaccion', 'insumo');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE recordatorio_tipo AS ENUM (
    'seguimiento_cotizacion', 'cobranza', 'alerta_pago', 'tarea'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE refaccion_categoria AS ENUM (
    'cardan', 'cruceta', 'material_electrico', 'soporteria',
    'hules', 'tornilleria', 'placas'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE rol_usuario AS ENUM (
    'admin', 'ventas', 'tecnico', 'facturacion',
    'direccion', 'cliente', 'administrativo'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_estado AS ENUM (
    'solicitud_recibida', 'cotizacion_enviada', 'cotizacion_aceptada',
    'asignacion_tecnico', 'servicio_programado', 'documentacion_enviada',
    'tecnico_en_contacto', 'servicio_en_proceso', 'autorizacion_adicional',
    'servicio_concluido', 'evidencia_cargada', 'documentacion_entregada',
    'encuesta_enviada', 'facturado', 'pagado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_prioridad AS ENUM ('baja', 'media', 'alta', 'urgente');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_evidencia AS ENUM (
    'foto_antes', 'foto_despues', 'video', 'documento', 'firma'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_servicio AS ENUM (
    'preventivo', 'correctivo', 'instalacion', 'diagnostico'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ════════════════════════════════════════════════════════════════
-- 2. COLUMNAS FALTANTES EN TABLAS EXISTENTES
-- ════════════════════════════════════════════════════════════════

-- empresas — campos que se agregaron directamente en Supabase
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS razon_social       TEXT,
  ADD COLUMN IF NOT EXISTS sucursal           TEXT,
  ADD COLUMN IF NOT EXISTS ciudad             TEXT,
  ADD COLUMN IF NOT EXISTS estado             TEXT,
  ADD COLUMN IF NOT EXISTS cp                 TEXT,
  ADD COLUMN IF NOT EXISTS persona_encargada  TEXT,
  ADD COLUMN IF NOT EXISTS activo             BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notas              TEXT,
  ADD COLUMN IF NOT EXISTS giro               TEXT,
  ADD COLUMN IF NOT EXISTS sitio_web          TEXT,
  ADD COLUMN IF NOT EXISTS condiciones_pago   condicion_pago,
  ADD COLUMN IF NOT EXISTS direccion_fiscal   TEXT;

-- usuarios — columnas extra y campo rol (el 001 usó 'role' TEXT)
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS apellido       TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url     TEXT,
  ADD COLUMN IF NOT EXISTS clerk_user_id  TEXT,
  ADD COLUMN IF NOT EXISTS telefono       TEXT,
  ADD COLUMN IF NOT EXISTS activo         BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ DEFAULT now();

-- oportunidades — campos extra
ALTER TABLE oportunidades
  ADD COLUMN IF NOT EXISTS contacto_id           UUID,
  ADD COLUMN IF NOT EXISTS descripcion           TEXT,
  ADD COLUMN IF NOT EXISTS fecha_cierre_estimada DATE,
  ADD COLUMN IF NOT EXISTS monto_estimado        NUMERIC,
  ADD COLUMN IF NOT EXISTS motivo_perdida        TEXT,
  ADD COLUMN IF NOT EXISTS notas                 TEXT,
  ADD COLUMN IF NOT EXISTS tipo                  oportunidad_tipo;

-- cotizaciones — campos extra
ALTER TABLE cotizaciones
  ADD COLUMN IF NOT EXISTS condiciones       TEXT,
  ADD COLUMN IF NOT EXISTS contacto_id       UUID,
  ADD COLUMN IF NOT EXISTS numero_cotizacion SERIAL,
  ADD COLUMN IF NOT EXISTS token_aprobacion  TEXT,
  ADD COLUMN IF NOT EXISTS total             NUMERIC,
  ADD COLUMN IF NOT EXISTS vigencia_dias     INT;

-- ordenes_servicio — campos extra agregados en Supabase
ALTER TABLE ordenes_servicio
  ADD COLUMN IF NOT EXISTS estado_facturacion  TEXT NOT NULL DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS monto_factura       NUMERIC,
  ADD COLUMN IF NOT EXISTS numero_factura      TEXT,
  ADD COLUMN IF NOT EXISTS concepto_factura    TEXT,
  ADD COLUMN IF NOT EXISTS fecha_vencimiento   DATE;

-- ════════════════════════════════════════════════════════════════
-- 3. NUEVAS TABLAS
-- ════════════════════════════════════════════════════════════════

-- SUCURSALES
CREATE TABLE IF NOT EXISTS sucursales (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id         UUID NOT NULL REFERENCES empresas(id),
  nombre             TEXT NOT NULL,
  direccion          TEXT,
  ciudad             TEXT,
  estado             TEXT,
  cp                 TEXT,
  telefono           TEXT,
  contacto_principal TEXT,
  es_matriz          BOOLEAN DEFAULT false,
  activo             BOOLEAN DEFAULT true,
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);

-- CONTACTOS
CREATE TABLE IF NOT EXISTS contactos (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id            UUID NOT NULL REFERENCES empresas(id),
  sucursal_id           UUID REFERENCES sucursales(id),
  nombre                TEXT NOT NULL,
  apellido              TEXT NOT NULL,
  puesto                TEXT,
  telefono              TEXT,
  celular               TEXT,
  email                 TEXT,
  es_contacto_principal BOOLEAN DEFAULT false,
  es_decisor            BOOLEAN DEFAULT false,
  notas                 TEXT,
  activo                BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- NOTAS DE CRÉDITO
CREATE TABLE IF NOT EXISTS notas_credito (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id  UUID REFERENCES empresas(id),
  os_id       UUID REFERENCES ordenes_servicio(id),
  numero_nc   TEXT,
  monto       NUMERIC NOT NULL DEFAULT 0,
  descripcion TEXT,
  fecha       DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- FIRMAS
CREATE TABLE IF NOT EXISTS firmas (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_id        UUID NOT NULL REFERENCES ordenes_servicio(id),
  tipo            TEXT NOT NULL DEFAULT 'cliente',
  token           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  firmado         BOOLEAN NOT NULL DEFAULT false,
  firma_url       TEXT,
  firmante_nombre TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- HISTORIAL DE ÓRDENES
CREATE TABLE IF NOT EXISTS orden_historial (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_id        UUID NOT NULL REFERENCES ordenes_servicio(id),
  usuario_id      UUID,
  estado_anterior TEXT,
  estado_nuevo    TEXT NOT NULL,
  nota            TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- CATÁLOGO DE FRENOS
CREATE TABLE IF NOT EXISTS cat_frenos (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  modelo         TEXT NOT NULL,
  descripcion    TEXT,
  especificaciones JSONB,
  precio_lista   NUMERIC NOT NULL DEFAULT 0,
  imagen_url     TEXT,
  activo         BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- CATÁLOGO DE REFACCIONES (tipado)
CREATE TABLE IF NOT EXISTS cat_refacciones (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre       TEXT NOT NULL,
  numero_parte TEXT,
  categoria    refaccion_categoria NOT NULL,
  descripcion  TEXT,
  precio_lista NUMERIC NOT NULL DEFAULT 0,
  unidad       TEXT,
  stock_minimo INT,
  activo       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- CATÁLOGO DE SERVICIOS
CREATE TABLE IF NOT EXISTS cat_servicios (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre                TEXT NOT NULL,
  tipo                  tipo_servicio NOT NULL,
  descripcion           TEXT,
  precio_base           NUMERIC NOT NULL DEFAULT 0,
  duracion_estimada_hrs NUMERIC,
  requiere_equipo       JSONB,
  activo                BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- ÍTEMS DE COTIZACIÓN
CREATE TABLE IF NOT EXISTS cotizacion_items (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cotizacion_id    UUID NOT NULL REFERENCES cotizaciones(id),
  tipo_item        cotizacion_item_tipo NOT NULL,
  catalogo_id      UUID,
  descripcion      TEXT NOT NULL,
  cantidad         NUMERIC NOT NULL DEFAULT 1,
  precio_unitario  NUMERIC NOT NULL DEFAULT 0,
  descuento_pct    NUMERIC,
  subtotal         NUMERIC,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- INVENTARIO
CREATE TABLE IF NOT EXISTS inventario (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre         TEXT NOT NULL,
  producto_tipo  producto_tipo NOT NULL,
  freno_id       UUID REFERENCES cat_frenos(id),
  refaccion_id   UUID REFERENCES cat_refacciones(id),
  codigo_interno TEXT,
  stock_actual   NUMERIC NOT NULL DEFAULT 0,
  stock_minimo   NUMERIC NOT NULL DEFAULT 0,
  costo_unitario NUMERIC,
  precio_venta   NUMERIC,
  ubicacion      TEXT,
  activo         BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- MOVIMIENTOS DE INVENTARIO
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inventario_id UUID NOT NULL REFERENCES inventario(id),
  tipo          movimiento_tipo NOT NULL,
  motivo        movimiento_motivo NOT NULL,
  cantidad      NUMERIC NOT NULL,
  ticket_id     UUID,
  oportunidad_id UUID REFERENCES oportunidades(id),
  notas         TEXT,
  created_by    UUID REFERENCES usuarios(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- TICKETS (sistema de servicio)
CREATE TABLE IF NOT EXISTS tickets (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_ticket         SERIAL,
  empresa_id            UUID NOT NULL REFERENCES empresas(id),
  sucursal_id           UUID REFERENCES sucursales(id),
  contacto_id           UUID REFERENCES contactos(id),
  cotizacion_id         UUID REFERENCES cotizaciones(id),
  tecnico_id            UUID REFERENCES usuarios(id),
  vendedor_id           UUID REFERENCES usuarios(id),
  tipo_servicio         tipo_servicio NOT NULL,
  descripcion           TEXT NOT NULL,
  estado                ticket_estado DEFAULT 'solicitud_recibida',
  prioridad             ticket_prioridad,
  fecha_programada      TIMESTAMPTZ,
  fecha_inicio_servicio TIMESTAMPTZ,
  fecha_fin_servicio    TIMESTAMPTZ,
  requiere_autorizacion BOOLEAN DEFAULT false,
  monto_facturado       NUMERIC,
  numero_factura        TEXT,
  fecha_factura         DATE,
  metodo_pago           TEXT,
  fecha_pago            DATE,
  notas_internas        TEXT,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- HISTORIAL DE TICKETS
CREATE TABLE IF NOT EXISTS ticket_historial (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id       UUID NOT NULL REFERENCES tickets(id),
  usuario_id      UUID REFERENCES usuarios(id),
  estado_anterior ticket_estado,
  estado_nuevo    ticket_estado NOT NULL,
  notas           TEXT,
  metadata        JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- EVIDENCIAS
CREATE TABLE IF NOT EXISTS evidencias (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id   UUID NOT NULL REFERENCES tickets(id),
  tipo        tipo_evidencia NOT NULL,
  archivo_url TEXT NOT NULL,
  descripcion TEXT,
  subido_por  UUID REFERENCES usuarios(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ENCUESTAS
CREATE TABLE IF NOT EXISTS encuestas (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id            UUID NOT NULL UNIQUE REFERENCES tickets(id),
  contacto_id          UUID REFERENCES contactos(id),
  token_acceso         TEXT,
  respondida           BOOLEAN DEFAULT false,
  calificacion_general INT,
  calificacion_tecnico INT,
  calificacion_tiempo  INT,
  comentarios          TEXT,
  fecha_envio          TIMESTAMPTZ,
  fecha_respuesta      TIMESTAMPTZ
);

-- RECORDATORIOS
CREATE TABLE IF NOT EXISTS recordatorios (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id         UUID REFERENCES usuarios(id),
  tipo               recordatorio_tipo NOT NULL,
  mensaje            TEXT NOT NULL,
  referencia_id      UUID,
  fecha_recordatorio TIMESTAMPTZ NOT NULL,
  completado         BOOLEAN DEFAULT false,
  created_at         TIMESTAMPTZ DEFAULT now()
);

-- AUDIT LOG
CREATE TABLE IF NOT EXISTS audit_log (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tabla            TEXT NOT NULL,
  registro_id      UUID NOT NULL,
  accion           audit_accion NOT NULL,
  datos_anteriores JSONB,
  datos_nuevos     JSONB,
  usuario_id       UUID REFERENCES usuarios(id),
  ip_address       INET,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════
-- 4. RLS — política permisiva para service_role en tablas nuevas
-- ════════════════════════════════════════════════════════════════

DO $$ DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'sucursales','contactos','notas_credito','firmas','orden_historial',
    'cat_frenos','cat_refacciones','cat_servicios','cotizacion_items',
    'inventario','movimientos_inventario','tickets','ticket_historial',
    'evidencias','encuestas','recordatorios','audit_log'
  ]) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = t AND policyname = 'service_role_all'
    ) THEN
      EXECUTE format(
        'CREATE POLICY "service_role_all" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)',
        t
      );
    END IF;
  END LOOP;
END $$;

-- ════════════════════════════════════════════════════════════════
-- 5. ÍNDICES ÚTILES
-- ════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_sucursales_empresa   ON sucursales(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contactos_empresa    ON contactos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_notas_credito_empresa ON notas_credito(empresa_id);
CREATE INDEX IF NOT EXISTS idx_notas_credito_os     ON notas_credito(os_id);
CREATE INDEX IF NOT EXISTS idx_firmas_orden         ON firmas(orden_id);
CREATE INDEX IF NOT EXISTS idx_orden_historial_orden ON orden_historial(orden_id);
CREATE INDEX IF NOT EXISTS idx_tickets_empresa      ON tickets(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tickets_estado       ON tickets(estado);
CREATE INDEX IF NOT EXISTS idx_tickets_tecnico      ON tickets(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_inventario_tipo      ON inventario(producto_tipo);
CREATE INDEX IF NOT EXISTS idx_recordatorios_usuario ON recordatorios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_tabla      ON audit_log(tabla, registro_id);
