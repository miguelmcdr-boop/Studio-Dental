-- ============================================================
-- Studio Dental — RLS por rol server-side (F6-B2)
-- Reescribe políticas de: 9 tablas clínicas + pacientes + citas
-- y bloquea la edición del rol espejo en profiles.
--
-- MATRIZ APLICADA (todas conservan ownership auth.uid() = user_id):
--   Tablas clínicas (evoluciones_clinicas, recetas, odontogramas,
--     periodontogramas, periodontogramas_historial, dsd_configs,
--     odontopediatria, quirurgico_implantes, quirurgico_endodoncia):
--       SELECT  -> admin, dentista, asistente
--       INSERT/UPDATE/DELETE -> admin, dentista
--   pacientes / citas:
--       SELECT/INSERT/UPDATE -> los 4 roles
--       DELETE -> admin, dentista
--   profiles: sin cambio de políticas; role espejo bloqueado (trigger)
--
-- Dependencias: schema.sql + schema-rbac.sql (F6-B1)
-- NO aplicar en producción hasta F6-B6 (migración de roles)
-- ============================================================

-- Helper: ¿el rol actual está en la lista?
CREATE OR REPLACE FUNCTION public.role_in(_roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_role() = ANY(_roles);
$$;

COMMENT ON FUNCTION public.role_in(app_role[]) IS
  'TRUE si el rol del JWT (app_metadata.role) está en la lista. Base de las políticas F6-B2.';

-- ============================================================
-- 1) Reescritura de políticas de las 9 tablas clínicas
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
    -- Elimina cualquier política previa de la tabla (idempotente)
    FOR pol IN SELECT policyname FROM pg_policies
               WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY %I ON %I', pol.policyname, t);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT
         USING (auth.uid() = user_id
                AND public.role_in(ARRAY[''admin'',''dentista'',''asistente'']::app_role[]))',
      t || '_select_rol', t);

    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT
         WITH CHECK (auth.uid() = user_id
                AND public.role_in(ARRAY[''admin'',''dentista'']::app_role[]))',
      t || '_insert_rol', t);

    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE
         USING (auth.uid() = user_id
                AND public.role_in(ARRAY[''admin'',''dentista'']::app_role[]))
         WITH CHECK (auth.uid() = user_id
                AND public.role_in(ARRAY[''admin'',''dentista'']::app_role[]))',
      t || '_update_rol', t);

    EXECUTE format(
      'CREATE POLICY %I ON %I FOR DELETE
         USING (auth.uid() = user_id
                AND public.role_in(ARRAY[''admin'',''dentista'']::app_role[]))',
      t || '_delete_rol', t);
  END LOOP;
END;
$$;

-- ============================================================
-- 2) pacientes (recepcion opera, pero no elimina)
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

CREATE POLICY pacientes_select_rol ON pacientes FOR SELECT
  USING (auth.uid() = user_id
         AND public.role_in(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY pacientes_insert_rol ON pacientes FOR INSERT
  WITH CHECK (auth.uid() = user_id
         AND public.role_in(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY pacientes_update_rol ON pacientes FOR UPDATE
  USING (auth.uid() = user_id
         AND public.role_in(ARRAY['admin','dentista','asistente','recepcion']::app_role[]))
  WITH CHECK (auth.uid() = user_id
         AND public.role_in(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY pacientes_delete_rol ON pacientes FOR DELETE
  USING (auth.uid() = user_id
         AND public.role_in(ARRAY['admin','dentista']::app_role[]));

-- ============================================================
-- 3) citas (recepcion opera agenda, pero no elimina)
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

CREATE POLICY citas_select_rol ON citas FOR SELECT
  USING (auth.uid() = user_id
         AND public.role_in(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY citas_insert_rol ON citas FOR INSERT
  WITH CHECK (auth.uid() = user_id
         AND public.role_in(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY citas_update_rol ON citas FOR UPDATE
  USING (auth.uid() = user_id
         AND public.role_in(ARRAY['admin','dentista','asistente','recepcion']::app_role[]))
  WITH CHECK (auth.uid() = user_id
         AND public.role_in(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY citas_delete_rol ON citas FOR DELETE
  USING (auth.uid() = user_id
         AND public.role_in(ARRAY['admin','dentista']::app_role[]));

-- ============================================================
-- 4) profiles: role espejo de solo lectura para sesiones authenticated
--    (los cambios de rol van por set_app_metadata_role / trigger B1)
-- ============================================================
CREATE OR REPLACE FUNCTION public.profiles_lock_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS lock_profiles_role ON profiles;
CREATE TRIGGER lock_profiles_role
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_lock_role();

-- ============================================================
-- Privilegios de tabla para los roles de PostgREST (F6-B2)
-- Sin esto, RLS nunca se evalúa: el request muere en el GRANT.
-- En Supabase cloud el template los incluye; en local hay que
-- versionarlos para que un proyecto limpio funcione (criterio F6-A).
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT SELECT ON public.vademecum, public.vademecum_urgencia,
  public.vademecum_antirresortivos, public.alergias_cruzadas,
  public.interacciones_farmacologicas, public.profilaxis_endocarditis,
  public.manejo_anticoagulantes, public.reference_data_meta TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO authenticated, service_role;
-- ============================================================
-- Studio Dental — RLS por rol: financiero + vademécum + audit (F6-B3)
--
-- MATRIZ APLICADA (ownership estricto D7 donde hay user_id):
--   movimientos_financieros / pagos: todo admin+dentista
--   presupuestos: CRUD los 4 roles; DELETE admin+dentista
--   presupuesto_items: vía presupuesto padre; CRUD 4 roles; DELETE admin+dentista
--   inventario: SELECT admin+dentista+asistente; escritura admin+dentista
--   8 tablas vademécum: lectura pública; escritura admin+dentista
--   audit_log: INSERT propia 4 roles; SELECT propia + admin todo;
--              sin UPDATE/DELETE (append-only)
--
-- Dependencias: schema*.sql + schema-rbac.sql + schema-rbac-policies.sql
-- ============================================================

-- ============================================================
-- 1) movimientos_financieros + pagos (finanzas: admin/dentista)
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
         USING (auth.uid() = user_id
                AND public.role_in(ARRAY[''admin'',''dentista'']::app_role[]))',
      t || '_select_rol', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT
         WITH CHECK (auth.uid() = user_id
                AND public.role_in(ARRAY[''admin'',''dentista'']::app_role[]))',
      t || '_insert_rol', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE
         USING (auth.uid() = user_id
                AND public.role_in(ARRAY[''admin'',''dentista'']::app_role[]))
         WITH CHECK (auth.uid() = user_id
                AND public.role_in(ARRAY[''admin'',''dentista'']::app_role[]))',
      t || '_update_rol', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR DELETE
         USING (auth.uid() = user_id
                AND public.role_in(ARRAY[''admin'',''dentista'']::app_role[]))',
      t || '_delete_rol', t);
  END LOOP;
END;
$$;

-- ============================================================
-- 2) presupuestos (operativo: 4 roles; DELETE admin/dentista)
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

CREATE POLICY presupuestos_select_rol ON presupuestos FOR SELECT
  USING (auth.uid() = user_id
         AND public.role_in(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY presupuestos_insert_rol ON presupuestos FOR INSERT
  WITH CHECK (auth.uid() = user_id
         AND public.role_in(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY presupuestos_update_rol ON presupuestos FOR UPDATE
  USING (auth.uid() = user_id
         AND public.role_in(ARRAY['admin','dentista','asistente','recepcion']::app_role[]))
  WITH CHECK (auth.uid() = user_id
         AND public.role_in(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY presupuestos_delete_rol ON presupuestos FOR DELETE
  USING (auth.uid() = user_id
         AND public.role_in(ARRAY['admin','dentista']::app_role[]));

-- ============================================================
-- 3) presupuesto_items (vía presupuesto padre + WITH CHECK correcto)
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

CREATE POLICY presupuesto_items_select_rol ON presupuesto_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM presupuestos p
                 WHERE p.id = presupuesto_items.presupuesto_id
                   AND p.user_id = auth.uid())
         AND public.role_in(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY presupuesto_items_insert_rol ON presupuesto_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM presupuestos p
                 WHERE p.id = presupuesto_items.presupuesto_id
                   AND p.user_id = auth.uid())
         AND public.role_in(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY presupuesto_items_update_rol ON presupuesto_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM presupuestos p
                 WHERE p.id = presupuesto_items.presupuesto_id
                   AND p.user_id = auth.uid())
         AND public.role_in(ARRAY['admin','dentista','asistente','recepcion']::app_role[]))
  WITH CHECK (EXISTS (SELECT 1 FROM presupuestos p
                 WHERE p.id = presupuesto_items.presupuesto_id
                   AND p.user_id = auth.uid())
         AND public.role_in(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY presupuesto_items_delete_rol ON presupuesto_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM presupuestos p
                 WHERE p.id = presupuesto_items.presupuesto_id
                   AND p.user_id = auth.uid())
         AND public.role_in(ARRAY['admin','dentista']::app_role[]));

-- ============================================================
-- 4) inventario (lectura + asistente; escritura admin/dentista)
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

CREATE POLICY inventario_select_rol ON inventario FOR SELECT
  USING (auth.uid() = user_id
         AND public.role_in(ARRAY['admin','dentista','asistente']::app_role[]));
CREATE POLICY inventario_insert_rol ON inventario FOR INSERT
  WITH CHECK (auth.uid() = user_id
         AND public.role_in(ARRAY['admin','dentista']::app_role[]));
CREATE POLICY inventario_update_rol ON inventario FOR UPDATE
  USING (auth.uid() = user_id
         AND public.role_in(ARRAY['admin','dentista']::app_role[]))
  WITH CHECK (auth.uid() = user_id
         AND public.role_in(ARRAY['admin','dentista']::app_role[]));
CREATE POLICY inventario_delete_rol ON inventario FOR DELETE
  USING (auth.uid() = user_id
         AND public.role_in(ARRAY['admin','dentista']::app_role[]));

-- ============================================================
-- 5) Vademécum (8 tablas): lectura pública + escritura admin/dentista
-- ============================================================
DO $$
DECLARE
  t text;
  pol record;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'vademecum','vademecum_urgencia','vademecum_antirresortivos',
    'alergias_cruzadas','interacciones_farmacologicas',
    'profilaxis_endocarditis','manejo_anticoagulantes','reference_data_meta'
  ]
  LOOP
    FOR pol IN SELECT policyname FROM pg_policies
               WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY %I ON %I', pol.policyname, t);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT USING (true)',
      'Lectura pública de ' || t, t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT
         WITH CHECK (public.role_in(ARRAY[''admin'',''dentista'']::app_role[]))',
      t || '_insert_rol', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE
         USING (public.role_in(ARRAY[''admin'',''dentista'']::app_role[]))
         WITH CHECK (public.role_in(ARRAY[''admin'',''dentista'']::app_role[]))',
      t || '_update_rol', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR DELETE
         USING (public.role_in(ARRAY[''admin'',''dentista'']::app_role[]))',
      t || '_delete_rol', t);
  END LOOP;
END;
$$;

-- ============================================================
-- 6) audit_log (append-only; admin lee todo)
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

CREATE POLICY audit_log_insert_rol ON audit_log FOR INSERT
  WITH CHECK (auth.uid() = user_id
         AND public.role_in(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
CREATE POLICY audit_log_select_own ON audit_log FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY audit_log_select_admin ON audit_log FOR SELECT
  USING (public.has_role('admin'::app_role));

-- ============================================================
-- 7) Privilegios (idempotente, cubre tablas nuevas)
-- ============================================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
