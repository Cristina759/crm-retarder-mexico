-- Add new columns for enhanced client management
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS telefono_2 VARCHAR(15),
ADD COLUMN IF NOT EXISTS telefono_3 VARCHAR(15),
ADD COLUMN IF NOT EXISTS email_2 TEXT,
ADD COLUMN IF NOT EXISTS nombre_titular TEXT,
ADD COLUMN IF NOT EXISTS nombre_sucursal TEXT;
