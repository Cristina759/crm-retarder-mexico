-- Create table for quote items
CREATE TABLE IF NOT EXISTS cotizaciones_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE CASCADE,
    concepto TEXT NOT NULL,
    cantidad NUMERIC NOT NULL DEFAULT 1,
    precio_usd NUMERIC NOT NULL DEFAULT 0,
    precio_mxn NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to cotizaciones
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS atencion_a TEXT;

-- Enable RLS for the new table
ALTER TABLE cotizaciones_items ENABLE ROW LEVEL SECURITY;

-- Allow read/write for authenticated users
CREATE POLICY "Allow authenticated full access to cotizaciones_items" 
    ON cotizaciones_items FOR ALL 
    USING (auth.role() = 'authenticated') 
    WITH CHECK (auth.role() = 'authenticated');
