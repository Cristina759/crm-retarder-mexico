-- 009_pipeline_comercial.sql
-- Paso 1: cambiar columna de ENUM a TEXT (libera restricción del tipo)
ALTER TABLE oportunidades
  ALTER COLUMN estado TYPE TEXT USING estado::TEXT;

-- Paso 2: migrar datos existentes al nuevo esquema de nombres
UPDATE oportunidades SET estado = 'cotizacion_enviada'    WHERE estado = 'cotizado';
UPDATE oportunidades SET estado = 'seguimiento'           WHERE estado = 'contactado';
UPDATE oportunidades SET estado = 'negociacion'           WHERE estado = 'negociacin';
UPDATE oportunidades SET estado = 'ganado'                WHERE estado = 'ganada';
UPDATE oportunidades SET estado = 'perdido'               WHERE estado = 'perdida';

-- Paso 3: agregar CHECK constraint con los nuevos valores válidos
ALTER TABLE oportunidades
  ALTER COLUMN estado SET DEFAULT 'prospecto',
  ADD CONSTRAINT oportunidades_estado_check
  CHECK (estado IN (
    'prospecto',
    'cotizacion_en_proceso',
    'cotizacion_enviada',
    'seguimiento',
    'negociacion',
    'ganado',
    'perdido'
  ));

-- Paso 4: columnas nuevas
ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS titulo            TEXT;
ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS motivo_perdida    TEXT;
ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS fecha_cierre_real TIMESTAMPTZ;

-- Paso 5: RLS
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "oportunidades_all" ON oportunidades;
CREATE POLICY "oportunidades_all" ON oportunidades
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
