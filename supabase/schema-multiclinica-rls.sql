-- ============================================================
-- F6-C-c.3: Reescritura de políticas RLS — aislamiento por clínica
-- ============================================================
-- Transforma las políticas F6-B (ownership auth.uid()=user_id + role_in)
-- a aislamiento multi-clínica (clinica_id=clinica_actual() + tiene_rol_en_clinica).
-- user_id se conserva como autoría (WITH CHECK de los INSERT).
--
-- NO toca: 8 tablas vademécum (globales) + profiles (identidad).
-- ============================================================

-- ============================================================
-- 1) 9 tablas clínicas: SELECT admin/dentista/asistente; escritura admin/dentista
-- ============================================================
DO $$
DECLARE
  t text;
  pol record;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'evoluciones_clinicas','recetas','odontogramas','periodontogramas',
    'periodontogramas_historial','dsd_configs','odontopediatria',
    'quirurgico_implantes','quirurgico_endodoncia'
  ]
  LOOP
    FOR pol IN SELECT policyname FROM pg_policies
               WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY %I ON %I', pol.policyname, t);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT
         USING (clinica_id = public.clinica_actual()
                AND public.tiene_rol_en_clinica(ARRAY[''admin'',''dentista'',''asistente'']::app_role[]))',
      t || '_select_clinica', t);

    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT
         WITH CHECK (clinica_id = public.clinica_actual()
                AND user_id = auth.uid()
                AND public.tiene_rol_en_clinica(ARRAY[''admin'',''dentista'']::app_role[]))',
      t || '_insert_clinica', t);

    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE
         USING (clinica_id = public.clinica_actual()
                AND public.tiene_rol_en_clinica(ARRAY[''admin'',''dentista'']::app_role[]))
         WITH CHECK (clinica_id = public.clinica_actual()
                AND public.tiene_rol_en_clinica(ARRAY[''admin'',''dentista'']::app_role[]))',
      t || '_update_clinica', t);

    EXECUTE format(
      'CREATE POLICY %I ON %I FOR DELETE
         USING (clinica_id = public.clinica_actual()
                AND public.tiene_rol_en_clinica(ARRAY[''admin'',''dentista'']::app_role[]))',
      t || '_delete_clinica', t);
  END LOOP;
END;
$$;

-- ============================================================
-- 2) pacientes: CRUD los 4 roles; DELETE admin/dentista
-- ============================================================
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies
             WHERE schemaname = 'public' AND tablename = 'pacientes'
  LOOP
    EXECUTE format('DROP POLICY %I ON %I', pol.policyname, 'pacientes');
  END LOOP;
END;
$$;

CREATE POLICY pacientes_select_clinica ON pacientes FOR SELECT
  USING (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY pacientes_insert_clinica ON pacientes FOR INSERT
  WITH CHECK (clinica_id = public.clinica_actual()
         AND user_id = auth.uid()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY pacientes_update_clinica ON pacientes FOR UPDATE
  USING (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[]))
  WITH CHECK (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY pacientes_delete_clinica ON pacientes FOR DELETE
  USING (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[]));

-- ============================================================
-- 3) citas: CRUD los 4 roles; DELETE admin/dentista
-- ============================================================
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies
             WHERE schemaname = 'public' AND tablename = 'citas'
  LOOP
    EXECUTE format('DROP POLICY %I ON %I', pol.policyname, 'citas');
  END LOOP;
END;
$$;

CREATE POLICY citas_select_clinica ON citas FOR SELECT
  USING (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY citas_insert_clinica ON citas FOR INSERT
  WITH CHECK (clinica_id = public.clinica_actual()
         AND user_id = auth.uid()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY citas_update_clinica ON citas FOR UPDATE
  USING (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[]))
  WITH CHECK (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY citas_delete_clinica ON citas FOR DELETE
  USING (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[]));

-- ============================================================
-- 4) movimientos_financieros + pagos: todo admin/dentista
-- ============================================================
DO $$
DECLARE
  t text;
  pol record;
BEGIN
  FOREACH t IN ARRAY ARRAY['movimientos_financieros','pagos']
  LOOP
    FOR pol IN SELECT policyname FROM pg_policies
               WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY %I ON %I', pol.policyname, t);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT
         USING (clinica_id = public.clinica_actual()
                AND public.tiene_rol_en_clinica(ARRAY[''admin'',''dentista'']::app_role[]))',
      t || '_select_clinica', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT
         WITH CHECK (clinica_id = public.clinica_actual()
                AND user_id = auth.uid()
                AND public.tiene_rol_en_clinica(ARRAY[''admin'',''dentista'']::app_role[]))',
      t || '_insert_clinica', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE
         USING (clinica_id = public.clinica_actual()
                AND public.tiene_rol_en_clinica(ARRAY[''admin'',''dentista'']::app_role[]))
         WITH CHECK (clinica_id = public.clinica_actual()
                AND public.tiene_rol_en_clinica(ARRAY[''admin'',''dentista'']::app_role[]))',
      t || '_update_clinica', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR DELETE
         USING (clinica_id = public.clinica_actual()
                AND public.tiene_rol_en_clinica(ARRAY[''admin'',''dentista'']::app_role[]))',
      t || '_delete_clinica', t);
  END LOOP;
END;
$$;

-- ============================================================
-- 5) presupuestos: CRUD 4 roles; DELETE admin/dentista
-- ============================================================
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies
             WHERE schemaname = 'public' AND tablename = 'presupuestos'
  LOOP
    EXECUTE format('DROP POLICY %I ON %I', pol.policyname, 'presupuestos');
  END LOOP;
END;
$$;

CREATE POLICY presupuestos_select_clinica ON presupuestos FOR SELECT
  USING (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY presupuestos_insert_clinica ON presupuestos FOR INSERT
  WITH CHECK (clinica_id = public.clinica_actual()
         AND user_id = auth.uid()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY presupuestos_update_clinica ON presupuestos FOR UPDATE
  USING (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[]))
  WITH CHECK (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY presupuestos_delete_clinica ON presupuestos FOR DELETE
  USING (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[]));

-- ============================================================
-- 6) presupuesto_items (D32): clinica_id directo, sin EXISTS con el padre
-- ============================================================
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies
             WHERE schemaname = 'public' AND tablename = 'presupuesto_items'
  LOOP
    EXECUTE format('DROP POLICY %I ON %I', pol.policyname, 'presupuesto_items');
  END LOOP;
END;
$$;

CREATE POLICY presupuesto_items_select_clinica ON presupuesto_items FOR SELECT
  USING (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY presupuesto_items_insert_clinica ON presupuesto_items FOR INSERT
  WITH CHECK (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY presupuesto_items_update_clinica ON presupuesto_items FOR UPDATE
  USING (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[]))
  WITH CHECK (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY presupuesto_items_delete_clinica ON presupuesto_items FOR DELETE
  USING (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[]));

-- ============================================================
-- 7) inventario: SELECT admin/dentista/asistente; escritura admin/dentista
-- ============================================================
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies
             WHERE schemaname = 'public' AND tablename = 'inventario'
  LOOP
    EXECUTE format('DROP POLICY %I ON %I', pol.policyname, 'inventario');
  END LOOP;
END;
$$;

CREATE POLICY inventario_select_clinica ON inventario FOR SELECT
  USING (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista','asistente']::app_role[]));
CREATE POLICY inventario_insert_clinica ON inventario FOR INSERT
  WITH CHECK (clinica_id = public.clinica_actual()
         AND user_id = auth.uid()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[]));
CREATE POLICY inventario_update_clinica ON inventario FOR UPDATE
  USING (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[]))
  WITH CHECK (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[]));
CREATE POLICY inventario_delete_clinica ON inventario FOR DELETE
  USING (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[]));

-- ============================================================
-- 8) prestaciones (D31): SELECT 4 roles; escritura admin/dentista
-- ============================================================
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies
             WHERE schemaname = 'public' AND tablename = 'prestaciones'
  LOOP
    EXECUTE format('DROP POLICY %I ON %I', pol.policyname, 'prestaciones');
  END LOOP;
END;
$$;

CREATE POLICY prestaciones_select_clinica ON prestaciones FOR SELECT
  USING (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY prestaciones_insert_clinica ON prestaciones FOR INSERT
  WITH CHECK (clinica_id = public.clinica_actual()
         AND user_id = auth.uid()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[]));
CREATE POLICY prestaciones_update_clinica ON prestaciones FOR UPDATE
  USING (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[]))
  WITH CHECK (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[]));
CREATE POLICY prestaciones_delete_clinica ON prestaciones FOR DELETE
  USING (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[]));

-- ============================================================
-- 9) audit_log (D33): append-only + aislamiento por clínica
-- ============================================================
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies
             WHERE schemaname = 'public' AND tablename = 'audit_log'
  LOOP
    EXECUTE format('DROP POLICY %I ON %I', pol.policyname, 'audit_log');
  END LOOP;
END;
$$;

CREATE POLICY audit_log_insert_clinica ON audit_log FOR INSERT
  WITH CHECK (clinica_id = public.clinica_actual()
         AND user_id = auth.uid()
         AND public.tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY audit_log_select_own ON audit_log FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY audit_log_select_admin ON audit_log FOR SELECT
  USING (clinica_id = public.clinica_actual()
         AND public.tiene_rol_en_clinica(ARRAY['admin']::app_role[]));
