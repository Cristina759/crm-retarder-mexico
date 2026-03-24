-- ══════════════════════════════════════════════════════════
-- RLS — inventario & movimientos_inventario
-- Ejecutar en: Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════

-- ── 1. Habilitar RLS en ambas tablas ──────────────────────
ALTER TABLE inventario                ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario    ENABLE ROW LEVEL SECURITY;

-- ── 2. Políticas para `inventario` ───────────────────────

-- Lectura: cualquier usuario autenticado puede ver el inventario activo
CREATE POLICY "inventario_select_authenticated"
ON inventario
FOR SELECT
TO authenticated
USING (activo = true);

-- Insertar: solo admin (service_role o usuarios con rol admin en metadata)
CREATE POLICY "inventario_insert_admin"
ON inventario
FOR INSERT
TO authenticated
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'rol') = 'ADMIN'
);

-- Actualizar stock: admin y sistema (el UPDATE de stock_actual lo hace el frontend autenticado)
CREATE POLICY "inventario_update_admin"
ON inventario
FOR UPDATE
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'rol') = 'ADMIN'
    OR (auth.jwt() -> 'app_metadata' ->> 'rol') IS NOT NULL  -- cualquier usuario logueado puede actualizar stock
)
WITH CHECK (true);

-- Eliminar: solo admin
CREATE POLICY "inventario_delete_admin"
ON inventario
FOR DELETE
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'rol') = 'ADMIN'
);

-- ── 3. Políticas para `movimientos_inventario` ───────────

-- Lectura: cualquier usuario autenticado
CREATE POLICY "movimientos_select_authenticated"
ON movimientos_inventario
FOR SELECT
TO authenticated
USING (true);

-- Insertar: cualquier usuario autenticado (registra movimientos)
CREATE POLICY "movimientos_insert_authenticated"
ON movimientos_inventario
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Actualizar: solo admin
CREATE POLICY "movimientos_update_admin"
ON movimientos_inventario
FOR UPDATE
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'rol') = 'ADMIN'
);

-- Eliminar: solo admin
CREATE POLICY "movimientos_delete_admin"
ON movimientos_inventario
FOR DELETE
TO authenticated
USING (
    (auth.jwt() -> 'app_metadata' ->> 'rol') = 'ADMIN'
);

-- ══════════════════════════════════════════════════════════
-- NOTA: Si tus usuarios usan Clerk (no Supabase Auth nativo),
-- las políticas de rol pueden simplificarse a:
--   USING (true)  → permite a todos los autenticados
-- ya que Clerk no inyecta app_metadata en auth.jwt() por defecto.
-- En ese caso, el control de acceso vive en el frontend (useRole()).
-- ══════════════════════════════════════════════════════════

-- Alternativa simplificada (recomendada si usas Clerk):
-- DROP POLICY IF EXISTS "inventario_insert_admin" ON inventario;
-- DROP POLICY IF EXISTS "inventario_update_admin" ON inventario;
-- DROP POLICY IF EXISTS "inventario_delete_admin" ON inventario;
-- DROP POLICY IF EXISTS "movimientos_update_admin" ON movimientos_inventario;
-- DROP POLICY IF EXISTS "movimientos_delete_admin" ON movimientos_inventario;

-- CREATE POLICY "inventario_all_authenticated" ON inventario FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- CREATE POLICY "movimientos_all_authenticated" ON movimientos_inventario FOR ALL TO authenticated USING (true) WITH CHECK (true);
