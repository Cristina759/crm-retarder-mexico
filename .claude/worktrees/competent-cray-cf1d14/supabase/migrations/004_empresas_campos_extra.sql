-- ── Migración 004: Campos de contacto extra en empresas ───────────────────────
-- Agrega los campos que usa clientes.ts pero no existían en el schema inicial

ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS telefono2        TEXT,
  ADD COLUMN IF NOT EXISTS telefono3        TEXT,
  ADD COLUMN IF NOT EXISTS email2           TEXT,
  ADD COLUMN IF NOT EXISTS contacto1_nombre TEXT,
  ADD COLUMN IF NOT EXISTS contacto1_cargo  TEXT,
  ADD COLUMN IF NOT EXISTS contacto2_nombre TEXT,
  ADD COLUMN IF NOT EXISTS contacto2_cargo  TEXT;
