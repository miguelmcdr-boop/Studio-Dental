-- F7-37 H-05b: Eliminar policy audit_log_insert_rol
--
-- PROBLEMA (auditoría F7-37, corrección de H-05):
-- La migración F7-37 000400 eliminó audit_log_insert_clinica, pero la policy
-- real que rompe el modelo append-only es audit_log_insert_rol, creada en
-- 20260101000006_rbac_policies.sql (línea 345).
--
-- Contenido de la policy problemática:
--   CREATE POLICY audit_log_insert_rol ON audit_log FOR INSERT
--     WITH CHECK (auth.uid() = user_id
--            AND public.role_in(ARRAY['admin','dentista','asistente','recepcion']::app_role[]));
--
-- Esto permite INSERT directo por usuarios authenticated con roles específicos,
-- posibilitando la inyección de registros falsos en audit_log.
--
-- CONTEXTO HISTÓRICO:
-- F7-08 (2026-08-29) eliminó audit_log_insert_clinica con la misma justificación.
-- La documentación de F7-08 dice:
--   "El trigger auditar_cambio() sigue insertando porque:
--    - Es SECURITY DEFINER
--    - Su owner es postgres con BYPASSRLS"
--
-- F7-08 NO eliminó audit_log_insert_rol, dejando el modelo append-only incompleto.
--
-- EVIDENCIA DE QUE ELIMINAR ES SEGURO:
-- - 0 callers en frontend (src/) hacen INSERT directo en audit_log
-- - 0 callers en Edge Functions hacen INSERT directo en audit_log
-- - Solo callers son funciones SECURITY DEFINER (registrar_evento_archivo,
--   registrar_evento_purge, registrar_exportacion, auditar_cambio, etc.)
--   que usan BYPASSRLS o tienen owner postgres
-- - 0 tests dependen de esta policy
--
-- SOLUCIÓN:
-- DROP POLICY audit_log_insert_rol — hace que audit_log sea estrictamente
-- append-only. Solo triggers y funciones SECURITY DEFINER pueden escribir.
--
-- ROLLBACK:
-- Si hay problemas, ejecutar:
--   CREATE POLICY audit_log_insert_rol ON public.audit_log FOR INSERT
--     WITH CHECK (
--       auth.uid() = user_id
--       AND public.role_in(ARRAY['admin','dentista','asistente','recepcion']::public.app_role[])
--     );
-- ============================================================

-- 1. Eliminar policy que permite INSERT directo
DROP POLICY IF EXISTS audit_log_insert_rol ON public.audit_log;

-- 2. Documentar cambio
COMMENT ON TABLE public.audit_log IS
  'F7-37 H-05b: Audit log estrictamente append-only. Escritura SOLO vía triggers '
  'SECURITY DEFINER (auditar_cambio) y funciones SECURITY DEFINER con BYPASSRLS '
  '(registrar_evento_archivo, registrar_evento_purge, registrar_exportacion). '
  'Usuarios authenticated NO pueden INSERT/UPDATE/DELETE directamente. '
  'SELECT own/admin/clínica permitido.';

-- 3. Verificación post-migración: listar policies existentes en audit_log
DO $$
DECLARE
  pol RECORD;
  policies_count INTEGER := 0;
  insert_policies INTEGER := 0;
BEGIN
  RAISE NOTICE 'F7-37 H-05b: Verificando policies en audit_log...';
  
  FOR pol IN
    SELECT policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'audit_log'
  LOOP
    policies_count := policies_count + 1;
    
    IF pol.cmd = 'INSERT' THEN
      insert_policies := insert_policies + 1;
      RAISE WARNING '  ⚠️  INSERT policy aún existe: %', pol.policyname;
    ELSE
      RAISE NOTICE '  ✅ % policy: %', pol.cmd, pol.policyname;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'F7-37 H-05b: Total policies en audit_log: %', policies_count;
  
  IF insert_policies > 0 THEN
    RAISE WARNING 'F7-37 H-05b: Quedan % INSERT policies en audit_log. Revisar.', insert_policies;
  ELSE
    RAISE NOTICE 'F7-37 H-05b: audit_log es estrictamente append-only (0 INSERT policies). ✅';
  END IF;
END;
$$;
