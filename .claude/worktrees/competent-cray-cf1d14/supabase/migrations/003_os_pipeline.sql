-- ── Migración 003: Pipeline de Órdenes de Servicio ───────────────────────────
-- Nuevos estados, nuevas columnas, archivo de pagadas

-- 1. Quitar constraint viejo de estados
ALTER TABLE ordenes_servicio DROP CONSTRAINT IF EXISTS os_estado_check;

-- 2. Nuevas columnas
ALTER TABLE ordenes_servicio
  ADD COLUMN IF NOT EXISTS numero_os_manual   TEXT,
  ADD COLUMN IF NOT EXISTS foto_os            TEXT,
  ADD COLUMN IF NOT EXISTS numero_orden_compra TEXT,
  ADD COLUMN IF NOT EXISTS foto_orden_compra  TEXT,
  ADD COLUMN IF NOT EXISTS archivada          BOOLEAN NOT NULL DEFAULT false;

-- 3. Migrar estados viejos → nuevo estado inicial
UPDATE ordenes_servicio
  SET estado = 'tecnico_asignado', fase = 1
  WHERE estado IN ('solicitud_recibida','cotizacion_generada','cotizacion_enviada','orden_confirmada');

UPDATE ordenes_servicio
  SET estado = 'servicio_en_proceso', fase = 1
  WHERE estado IN ('documentacion_permisos','tecnico_notificado','fotos_antes_cargadas');

UPDATE ordenes_servicio
  SET estado = 'evidencia_cargada', fase = 2
  WHERE estado IN ('prueba_de_campo','firmas_completadas','fotos_despues_cargadas');

UPDATE ordenes_servicio
  SET estado = 'encuesta_enviada', fase = 3
  WHERE estado = 'encuesta_factura';

-- 4. Nuevo constraint con los 12 estados
ALTER TABLE ordenes_servicio
  ADD CONSTRAINT os_estado_check CHECK (estado IN (
    'tecnico_asignado',
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
  ));

-- 5. Actualizar default
ALTER TABLE ordenes_servicio ALTER COLUMN estado SET DEFAULT 'tecnico_asignado';
ALTER TABLE ordenes_servicio ALTER COLUMN fase   SET DEFAULT 1;
