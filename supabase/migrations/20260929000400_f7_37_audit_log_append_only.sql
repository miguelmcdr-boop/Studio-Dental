-- F7-37: Eliminar policy audit_log_insert_clinica
--
-- PROBLEMA (auditoría F7-37, hallazgo H-05):
-- La migración 20260101000004_multiclinica_rls.sql (línea 297) creó la policy:
--   CREATE POLICY audit_log_insert_clinica ON audit_log FOR INSERT
--     WITH CHECK (clinica_id = public.clinica_actual()
--            AND user_id = auth.uid()
--            AND public.tiene_rol_en_clinica(ARRAY['admin','dentista',...]::app_role[]));
--
-- Esto permite INSERT directo en audit_log por usuarios authenticated, lo cual
-- viola el principio de "append-only server-side". El diseño correcto es:
-- - Usuarios NO pueden insertar directamente en audit_log
-- - Solo el trigger auditar_cambio() (SECURITY DEFINER, owner postgres, BYPASSRLS)
--   puede escribir en audit_log
--
-- VERIFICACIÓN PREVIA:
-- - Búsqueda de callers de INSERT INTO audit_log: 0 ocurrencias en código
-- - El trigger auditar_cambio() usa BYPASSRLS, NO depende de esta policy
-- - Las policies SELECT (select_own, select_admin) permanecen intactas
-- - Las policies UPDATE/DELETE ya son USING (false) — sin cambios
--
-- SOLUCIÓN:
-- DROP POLICY audit_log_insert_clinica — hace que audit_log sea estrictamente
-- append-only. Solo triggers SECURITY DEFINER pueden escribir.
--
-- ROLLBACK:
-- Si hay problemas, ejecutar:
--   CREATE POLICY audit_log_insert_clinica ON public.audit_log FOR INSERT
--     WITH CHECK (
--       clinica_id = public.clinica_actual()
--       AND user_id = auth.uid()
--       AND public.tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::public.app_role[])
--     );
-- ============================================================

-- 1. Eliminar policy que permite INSERT directo
DROP POLICY IF EXISTS audit_log_insert_clinica ON public.audit_log;

-- 2. Documentar cambio
COMMENT ON TABLE public.audit_log IS
  'F7-37: Audit log append-only. Escritura SOLO vía trigger auditar_cambio() '
  '(SECURITY DEFINER, owner postgres, BYPASSRLS). Usuarios authenticated NO pueden '
  'INSERT/UPDATE/DELETE directamente. SELECT own/admin permitido.';

-- 3. Verificación post-migración: listar policies existentes en audit_log
DO $$
DECLARE
  pol RECORD;
  policies_count INTEGER := 0;
  insert_policies INTEGER := 0;
BEGIN
  RAISE NOTICE 'F7-37: Verificando policies en audit_log...';
  
  FOR pol IN
    SELECT policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'audit_log'
  LOOP
    policies_count := policies_count + 1;
    
    IF pol.cmd = 'INSERT' THEN
      insert_policies := insert_policies + 1;
      RAISE WARNING '  ⚠️  INSERT policy aún existe: %', pol.policyname;
    ELSE
      RAISE NOTICE '  ✅ % policy: % (cmd: %)', pol.cmd, pol.policyname, pol.cmd;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'F7-37: Total policies en audit_log: %', policies_count;
  
  IF insert_policies > 0 THEN
    RAISE WARNING 'F7-37: Quedan % policies INSERT en audit_log. Revisar.', insert_policies;
  ELSE
    RAISE NOTICE 'F7-37: audit_log es estrictamente append-only (0 INSERT policies).';
  END IF;
END;
$$;
