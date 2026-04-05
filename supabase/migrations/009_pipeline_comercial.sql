-- Actualizar estados del pipeline comercial
ALTER TABLE oportunidades DROP CONSTRAINT IF EXISTS oportunidades_estado_check;

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

-- Migrar datos existentes al nuevo schema
UPDATE oportunidades SET estado = 'prospecto' WHERE estado = 'prospecto';
UPDATE oportunidades SET estado = 'cotizacion_enviada' WHERE estado = 'cotizado';
UPDATE oportunidades SET estado = 'seguimiento' WHERE estado = 'contactado';
UPDATE oportunidades SET estado = 'negociacion' WHERE estado = 'negociacion' OR estado = 'negociacin';
UPDATE oportunidades SET estado = 'ganado' WHERE estado = 'ganada';
UPDATE oportunidades SET estado = 'perdido' WHERE estado = 'perdida';

-- Columnas nuevas
ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS titulo TEXT;
ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS motivo_perdida TEXT;
ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS fecha_cierre_real TIMESTAMPTZ;
ALTER TABLE oportunidades ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- RLS
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "oportunidades_all" ON oportunidades FOR ALL TO authenticated USING (true) WITH CHECK (true);
