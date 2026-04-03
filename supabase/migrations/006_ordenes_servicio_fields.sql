-- Add missing fields to ordenes_servicio table (current table)
ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS numero_orden_fisica TEXT;
ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS numero_orden_compra TEXT;
ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS monto DECIMAL(12,2);
ALTER TABLE ordenes_servicio ADD COLUMN IF NOT EXISTS fecha_creado DATE DEFAULT CURRENT_DATE;

-- Add missing fields to tickets table (potential legacy/alias table)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'tickets') THEN
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS numero_orden_fisica TEXT;
        ALTER TABLE tickets ADD COLUMN IF NOT EXISTS numero_orden_compra TEXT;
    END IF;
END $$;

-- Add comments for clarity
COMMENT ON COLUMN ordenes_servicio.numero_orden_fisica IS 'Número de la orden de servicio en papel/física';
COMMENT ON COLUMN ordenes_servicio.numero_orden_compra IS 'Número de la orden de compra (OC) del cliente';
COMMENT ON COLUMN ordenes_servicio.monto IS 'Monto total de la orden de servicio';
COMMENT ON COLUMN ordenes_servicio.fecha_creado IS 'Fecha de creación de la orden para propósitos de ordenamiento y visualización';
