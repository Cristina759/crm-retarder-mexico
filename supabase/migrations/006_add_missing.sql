-- ============================================================
-- 006 — Columnas y tablas faltantes
-- ============================================================

-- 1. Historial de pagos parciales en órdenes de servicio
--    Se almacena como array JSON: [{ id, monto, fecha, referencia }]
ALTER TABLE ordenes_servicio
  ADD COLUMN IF NOT EXISTS abonos JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Tabla de documentos de usuario (vinculada a IDs de Clerk)
CREATE TABLE IF NOT EXISTS documentos_usuario (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id   TEXT        NOT NULL,
  nombre       TEXT        NOT NULL,
  storage_path TEXT        NOT NULL,
  tipo         TEXT,
  tamanio      BIGINT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documentos_usuario_usuario_id
  ON documentos_usuario(usuario_id);
