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
