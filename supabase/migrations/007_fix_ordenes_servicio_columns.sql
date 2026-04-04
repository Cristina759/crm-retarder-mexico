-- Fix: ensure all columns added in migration 006 actually exist in the DB
-- (006 may not have been applied to the live Supabase instance)
ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS numero_orden_fisica TEXT;
ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS numero_orden_compra TEXT;
ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS monto DECIMAL(12,2);
ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS fecha_creado DATE DEFAULT CURRENT_DATE;
ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS vendedor TEXT;
ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS tecnico TEXT;
ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS empresa TEXT;
