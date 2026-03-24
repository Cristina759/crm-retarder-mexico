-- ══════════════════════════════════════════════════════════
-- RLS — catalogo_servicios
-- Ejecutar en: Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════

-- 1. Habilitar RLS
ALTER TABLE catalogo_servicios ENABLE ROW LEVEL SECURITY;

-- 2. Lectura: cualquier usuario autenticado puede ver servicios activos
CREATE POLICY "servicios_select_authenticated"
ON catalogo_servicios
FOR SELECT
TO authenticated
USING (activo = true);

-- 3. Insertar: solo admin
CREATE POLICY "servicios_insert_admin"
ON catalogo_servicios
FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'rol') = 'ADMIN'
);

-- 4. Actualizar: solo admin (cubre edición y soft-delete activo=false)
CREATE POLICY "servicios_update_admin"
ON catalogo_servicios
FOR UPDATE
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'rol') = 'ADMIN'
)
WITH CHECK (true);

-- 5. Eliminar físico: solo admin
CREATE POLICY "servicios_delete_admin"
ON catalogo_servicios
FOR DELETE
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'rol') = 'ADMIN'
);

-- ══════════════════════════════════════════════════════════
-- NOTA: Si usas Clerk, el JWT no incluye app_metadata por
-- defecto. Usa la alternativa simplificada:
-- ══════════════════════════════════════════════════════════
-- DROP POLICY IF EXISTS "servicios_select_authenticated" ON catalogo_servicios;
-- DROP POLICY IF EXISTS "servicios_insert_admin" ON catalogo_servicios;
-- DROP POLICY IF EXISTS "servicios_update_admin" ON catalogo_servicios;
-- DROP POLICY IF EXISTS "servicios_delete_admin" ON catalogo_servicios;
-- CREATE POLICY "servicios_all_authenticated" ON catalogo_servicios FOR ALL TO authenticated USING (true) WITH CHECK (true);
