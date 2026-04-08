-- ============================================
-- CRM RETARDER MÉXICO — Row Level Security
-- supabase/migrations/002_rls.sql
-- ============================================

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE usuarios          ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE oportunidades      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_servicio   ENABLE ROW LEVEL SECURITY;
ALTER TABLE orden_historial    ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidencias         ENABLE ROW LEVEL SECURITY;
ALTER TABLE encuestas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmas             ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS: usuarios
-- ============================================
-- Todos los autenticados pueden leer
CREATE POLICY "usuarios_select" ON usuarios
  FOR SELECT TO authenticated
  USING (true);

-- Solo admin/direccion pueden insertar y modificar
CREATE POLICY "usuarios_insert" ON usuarios
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('admin', 'direccion'));

CREATE POLICY "usuarios_update" ON usuarios
  FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'direccion'));

CREATE POLICY "usuarios_delete" ON usuarios
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'direccion'));

-- ============================================
-- POLÍTICAS: empresas
-- ============================================
CREATE POLICY "empresas_select" ON empresas
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "empresas_insert" ON empresas
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "empresas_update" ON empresas
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "empresas_delete" ON empresas
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'direccion'));

-- ============================================
-- POLÍTICAS: cotizaciones
-- ============================================
CREATE POLICY "cotizaciones_select" ON cotizaciones
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "cotizaciones_insert" ON cotizaciones
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "cotizaciones_update" ON cotizaciones
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "cotizaciones_delete" ON cotizaciones
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'direccion'));

-- ============================================
-- POLÍTICAS: oportunidades
-- ============================================
CREATE POLICY "oportunidades_select" ON oportunidades
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "oportunidades_insert" ON oportunidades
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "oportunidades_update" ON oportunidades
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "oportunidades_delete" ON oportunidades
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'direccion'));

-- ============================================
-- POLÍTICAS: ordenes_servicio
-- Técnicos solo ven sus órdenes asignadas
-- ============================================
CREATE POLICY "ordenes_select" ON ordenes_servicio
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() ->> 'user_role') != 'tecnico'
    OR
    tecnico_id = (
      SELECT id FROM usuarios
      WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "ordenes_insert" ON ordenes_servicio
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "ordenes_update" ON ordenes_servicio
  FOR UPDATE TO authenticated
  USING (
    (auth.jwt() ->> 'user_role') != 'tecnico'
    OR
    tecnico_id = (
      SELECT id FROM usuarios
      WHERE clerk_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "ordenes_delete" ON ordenes_servicio
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'direccion'));

-- ============================================
-- POLÍTICAS: orden_historial
-- Append-only: solo SELECT e INSERT
-- ============================================
CREATE POLICY "historial_select" ON orden_historial
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "historial_insert" ON orden_historial
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================
-- POLÍTICAS: evidencias
-- ============================================
CREATE POLICY "evidencias_select" ON evidencias
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "evidencias_insert" ON evidencias
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "evidencias_delete" ON evidencias
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'direccion'));

-- ============================================
-- POLÍTICAS: encuestas
-- Lectura y escritura pública por token (sin auth)
-- ============================================
-- Autenticados: lectura total
CREATE POLICY "encuestas_select_auth" ON encuestas
  FOR SELECT TO authenticated
  USING (true);

-- Anónimos: pueden leer y responder por token
CREATE POLICY "encuestas_select_anon" ON encuestas
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "encuestas_update_anon" ON encuestas
  FOR UPDATE TO anon
  USING (respondida = false);

-- Autenticados: pueden gestionar
CREATE POLICY "encuestas_insert" ON encuestas
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "encuestas_update_auth" ON encuestas
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "encuestas_delete" ON encuestas
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'direccion'));

-- ============================================
-- POLÍTICAS: firmas
-- Lectura y escritura pública por token (sin auth)
-- ============================================
-- Autenticados: lectura total
CREATE POLICY "firmas_select_auth" ON firmas
  FOR SELECT TO authenticated
  USING (true);

-- Anónimos: pueden leer y firmar por token
CREATE POLICY "firmas_select_anon" ON firmas
  FOR SELECT TO anon
  USING (true);

CREATE POLICY "firmas_update_anon" ON firmas
  FOR UPDATE TO anon
  USING (firmado = false);

-- Autenticados: pueden gestionar
CREATE POLICY "firmas_insert" ON firmas
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "firmas_update_auth" ON firmas
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "firmas_delete" ON firmas
  FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'user_role') IN ('admin', 'direccion'));
