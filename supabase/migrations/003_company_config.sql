-- 003_company_config.sql
CREATE TABLE IF NOT EXISTS configuracion_empresa (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  razon_social text,
  rfc text,
  direccion text,
  telefono text,
  email text,
  sitio_web text,
  margen_proteccion numeric DEFAULT 0,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insertar registro base para la demo si no existe
INSERT INTO configuracion_empresa (razon_social, rfc, sitio_web)
VALUES ('RETARDER MÉXICO', 'GURT721015BN8', 'retardermex.com')
ON CONFLICT DO NOTHING;
