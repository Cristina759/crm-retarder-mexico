-- Agregar columna para el número de orden de servicio física (papel)
-- Ejecutar en Supabase SQL Editor

ALTER TABLE ordenes_servicio 
ADD COLUMN IF NOT EXISTS numero_orden_fisica TEXT DEFAULT NULL;

-- Verificar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ordenes_servicio' AND column_name = 'numero_orden_fisica';
