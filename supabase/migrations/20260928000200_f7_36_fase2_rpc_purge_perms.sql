-- ============================================================
-- F7-36 FASE 2 (Commit 2.2): Endurecer permisos de funciones
-- de purge y triggers SECURITY DEFINER
-- ============================================================
--
-- PROBLEMA (hallazgo de auditoría 2026-09-28):
-- Las funciones registrar_evento_purge, purgar_archivos_expirados,
-- purgar_certificados_expirados y validar_eliminado_at_certificados
-- están definidas como SECURITY DEFINER pero NO tienen REVOKE FROM
-- PUBLIC ni GRANT explícito. Por defecto en PostgreSQL, PUBLIC
-- puede ejecutar cualquier función, lo que significa que cualquier
-- usuario autenticado puede invocar estas RPCs vía Data API.
--
-- RIESGOS ESPECÍFICOS:
-- 1. registrar_evento_purge(): usuario normal puede fabricar eventos
--    de auditoría falsos (ADMIN_PURGE_PACIENTES, ADMIN_PURGE_ARCHIVOS)
-- 2. purgar_archivos_expirados(): usuario normal puede disparar purga
--    automática de archivos en papelera
-- 3. purgar_certificados_expirados(): usuario normal puede disparar
--    purga de certificados vencidos
-- 4. validar_eliminado_at_certificados(): usuario normal puede invocar
--    trigger helper fuera de contexto
--
-- REGLA DEL BRIEF F7-36 FASE 2:
-- "RLS NO protege automáticamente la ejecución de una función.
-- Comprueba permisos de ejecución explícitamente."
--
-- CALLERS REALES (verificados en Edge Functions + pg_cron):
-- - registrar_evento_purge: Edge Functions (archivos-purge, pacientes-purge)
--   usando SUPABASE_SERVICE_ROLE_KEY
-- - purgar_archivos_expirados: pg_cron (corre como postgres internamente)
-- - purgar_certificados_expirados: pg_cron (corre como postgres internamente)
-- - validar_eliminado_at_certificados: trigger BEFORE UPDATE ON certificados
--
-- SOLUCIÓN (solo permisos, no tocar lógica):
-- REVOKE EXECUTE FROM PUBLIC, authenticated, anon
-- GRANT EXECUTE TO service_role (solo para las que lo necesitan)
--
-- ALCANCE:
-- - Solo ajusta permisos (NO modifica lógica interna)
-- - NO modifica SET search_path (eso corresponde a FASE 3)
-- - NO reescribe las funciones (idempotente por naturaleza de REVOKE/GRANT)
--
-- TEST OBLIGATORIO (Commit 2.3):
-- Usuario autenticado normal NO debe poder invocar registrar_evento_purge()
-- vía Data API. Debe recibir error "permission denied for function".
--
-- NOTA: Commit 2.1 (registrar_evento_archivo) ya fue aplicado en migración
-- 2026_09_28_0001_f7_36_fase2_rpc_evento_archivo_perms.sql
-- ============================================================

-- ============================================================
-- 1. registrar_evento_purge (target principal del brief)
-- ============================================================
-- Caller: Edge Functions (archivos-purge, pacientes-purge) con service_role
-- Firma: (p_clinica_id UUID, p_evento TEXT, p_detalle JSONB, p_user_id UUID)
REVOKE ALL ON FUNCTION public.registrar_evento_purge(UUID, TEXT, JSONB, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.registrar_evento_purge(UUID, TEXT, JSONB, UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_evento_purge(UUID, TEXT, JSONB, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.registrar_evento_purge(UUID, TEXT, JSONB, UUID) TO service_role;

COMMENT ON FUNCTION public.registrar_evento_purge(UUID, TEXT, JSONB, UUID) IS
  'F7-36 FASE 2: Registra eventos de purge en audit_log (ADMIN_PURGE_PACIENTES, ADMIN_PURGE_ARCHIVOS). '
  'SECURITY DEFINER. Permisos: solo service_role (Edge Functions archivos-purge y pacientes-purge). '
  'Usuario autenticado normal NO puede invocar esta función.';

-- ============================================================
-- 2. purgar_archivos_expirados (cron-only)
-- ============================================================
-- Caller: pg_cron (job purge-archivos-expirados, corre como postgres)
-- No necesita GRANT a service_role porque pg_cron corre como superuser
REVOKE ALL ON FUNCTION public.purgar_archivos_expirados() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purgar_archivos_expirados() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.purgar_archivos_expirados() FROM anon;

COMMENT ON FUNCTION public.purgar_archivos_expirados() IS
  'F7-36 FASE 2: Purga automática de archivos en papelera (>30 días). '
  'SECURITY DEFINER. Caller: pg_cron job purge-archivos-expirados. '
  'Usuario autenticado normal NO puede invocar esta función.';

-- ============================================================
-- 3. purgar_certificados_expirados (cron-only)
-- ============================================================
-- Caller: pg_cron (job purge-certificados-expirados, corre como postgres)
REVOKE ALL ON FUNCTION public.purgar_certificados_expirados() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purgar_certificados_expirados() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.purgar_certificados_expirados() FROM anon;

COMMENT ON FUNCTION public.purgar_certificados_expirados() IS
  'F7-36 FASE 2: Purga automática de certificados en papelera (>730 días). '
  'SECURITY DEFINER. Caller: pg_cron job purge-certificados-expirados. '
  'Usuario autenticado normal NO puede invocar esta función.';

-- ============================================================
-- 4. validar_eliminado_at_certificados (trigger helper)
-- ============================================================
-- Caller: trigger BEFORE UPDATE ON certificados (invocada por PostgreSQL)
-- No necesita GRANT porque los triggers invocan funciones como owner de la tabla
REVOKE ALL ON FUNCTION public.validar_eliminado_at_certificados() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validar_eliminado_at_certificados() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.validar_eliminado_at_certificados() FROM anon;

COMMENT ON FUNCTION public.validar_eliminado_at_certificados() IS
  'F7-36 FASE 2: Valida que solo admin puede cambiar eliminado_at. '
  'SECURITY DEFINER. Caller: trigger BEFORE UPDATE ON certificados. '
  'Usuario autenticado normal NO puede invocar esta función fuera del trigger.';

-- ============================================================
-- VERIFICACIÓN (ejecutar manualmente después de aplicar)
-- ============================================================
-- 1. Ver permisos de funciones SECURITY DEFINER:
--
--    SELECT p.proname,
--           pg_get_userbyid(p.proowner) AS owner,
--           has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_can_exec,
--           has_function_privilege('public', p.oid, 'EXECUTE') AS public_can_exec,
--           has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_can_exec
--    FROM pg_proc p
--    JOIN pg_namespace n ON p.pronamespace = n.oid
--    WHERE n.nspname = 'public' AND p.prosecdef = true
--    ORDER BY p.proname;
--
-- Esperado para las 4 funciones de esta migración:
--   - auth_can_exec = false
--   - public_can_exec = false
--   - service_can_exec = true (solo registrar_evento_purge)
--
-- 2. Test obligatorio del brief (simulado como usuario autenticado):
--
--    SET ROLE authenticated;
--    SELECT public.registrar_evento_purge(
--      '00000000-0000-0000-0000-000000000000'::uuid,
--      'FAKE_EVENT',
--      '{}'::jsonb,
--      '00000000-0000-0000-0000-000000000000'::uuid
--    );
--    -- Esperado: ERROR "permission denied for function registrar_evento_purge"
--    RESET ROLE;
