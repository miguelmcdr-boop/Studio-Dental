-- ============================================================
-- F7-36 FASE 2 (Commit 2.5): HOTFIX de permisos incompletos
-- ============================================================
--
-- PROBLEMA (descubierto post-merge al aplicar en staging):
--
-- 1. registrar_evento_archivo(UUID, TEXT, JSONB):
--    Commit 2.1 hizo REVOKE FROM PUBLIC pero NO hizo
--    REVOKE FROM authenticated/anon. Quedó con auth_can_exec=true.
--    Usuario normal puede fabricar eventos FILE_UPLOAD/DOWNLOAD/DELETE falsos.
--
-- 2. registrar_evento_purge:
--    Commit 2.2 solo revocó la firma v2 (4 args), ignorando la firma v1
--    (3 args) de la migración 20260101000016. La v1 sigue invocable
--    por authenticated Y public. Usuario normal puede fabricar eventos
--    ADMIN_PURGE_* falsos invocando la firma antigua.
--
-- 3. purgar_archivos_expirados, purgar_certificados_expirados,
--    validar_eliminado_at_certificados:
--    Tienen service_can_exec=true innecesario. pg_cron corre como postgres
--    (superuser) y los triggers invocan como owner de la tabla. El GRANT
--    a service_role es una mala práctica que amplía superficie innecesaria.
--
-- IMPACTO:
-- El estado actual VIOLA el principio del brief: "NO permitir fabricar
-- auditoría". Usuarios autenticados normales PODÍAN fabricar eventos
-- de auditoría falsos invocando directamente vía Data API.
--
-- SOLUCIÓN:
-- Completar los REVOKE faltantes. No se toca la lógica interna de
-- las funciones (principio conservador).
--
-- TEST OBLIGATORIO (post-aplicación):
-- SET ROLE authenticated;
-- SELECT public.registrar_evento_purge(
--   '00000000-0000-0000-0000-000000000000'::uuid, 'FAKE', '{}'::jsonb
-- );
-- -- Esperado: ERROR "permission denied for function registrar_evento_purge"
-- RESET ROLE;
-- ============================================================

-- ============================================================
-- 1. registrar_evento_archivo: completar REVOKE faltante
-- ============================================================
-- Commit 2.1 hizo REVOKE FROM PUBLIC pero NO FROM authenticated/anon.
-- Alguna migración previa otorgó GRANT EXECUTE TO authenticated que
-- quedó intacto.
REVOKE EXECUTE ON FUNCTION public.registrar_evento_archivo(UUID, TEXT, JSONB) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_evento_archivo(UUID, TEXT, JSONB) FROM anon;

COMMENT ON FUNCTION public.registrar_evento_archivo(UUID, TEXT, JSONB) IS
  'F7-36 FASE 2 (hotfix 2.5): Registra eventos de archivos clínicos en audit_log. '
  'SECURITY DEFINER. Permisos: SOLO service_role (Edge Functions r2-*). '
  'Usuario autenticado normal NO puede invocar esta función.';

-- ============================================================
-- 2. registrar_evento_purge v1 (3 args): revocar completamente
-- ============================================================
-- Commit 2.2 solo revocó la firma v2 (4 args). La firma v1 de
-- 20260101000016 sigue siendo invocable por authenticated y public.
-- Esta firma está obsoleta (reemplazada por v2 en 20260101000017)
-- pero no fue eliminada, por lo que sigue siendo un vector de ataque.
REVOKE ALL ON FUNCTION public.registrar_evento_purge(UUID, TEXT, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.registrar_evento_purge(UUID, TEXT, JSONB) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_evento_purge(UUID, TEXT, JSONB) FROM anon;
REVOKE EXECUTE ON FUNCTION public.registrar_evento_purge(UUID, TEXT, JSONB) FROM service_role;

COMMENT ON FUNCTION public.registrar_evento_purge(UUID, TEXT, JSONB) IS
  'F7-36 FASE 2 (hotfix 2.5): Firma OBSOLETA de registrar_evento_purge (3 args). '
  'Reemplazada por v2 (4 args) en 20260101000017. '
  'SECURITY DEFINER. Permisos: NADIE puede invocar directamente. '
  'Edge Functions deben usar la firma v2 con p_user_id explícito.';

-- ============================================================
-- 3. Cron/trigger: revocar service_role innecesario
-- ============================================================
-- pg_cron corre como postgres (superuser), no necesita GRANT.
-- Triggers invocan como owner de la tabla, no necesitan GRANT.
-- El GRANT a service_role era una mala práctica que ampliaba
-- superficie innecesariamente.
REVOKE EXECUTE ON FUNCTION public.purgar_archivos_expirados() FROM service_role;
REVOKE EXECUTE ON FUNCTION public.purgar_certificados_expirados() FROM service_role;
REVOKE EXECUTE ON FUNCTION public.validar_eliminado_at_certificados() FROM service_role;

-- ============================================================
-- VERIFICACIÓN (ejecutar manualmente después de aplicar)
-- ============================================================
--
-- Query 1: Verificar permisos de TODAS las firmas
--
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS args_signature,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_can_exec,
       has_function_privilege('public', p.oid, 'EXECUTE') AS public_can_exec,
       has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_can_exec
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'registrar_evento_archivo',
    'registrar_evento_purge',
    'purgar_archivos_expirados',
    'purgar_certificados_expirados',
    'validar_eliminado_at_certificados'
  )
ORDER BY p.proname, pg_get_function_identity_arguments(p.oid);
--
-- RESULTADO ESPERADO (6 filas):
--
-- purgar_archivos_expirados         |                  | false | false | false
-- purgar_certificados_expirados     |                  | false | false | false
-- registrar_evento_archivo          | uuid, text, jsonb| false | false | true
-- registrar_evento_purge            | uuid, text, jsonb| false | false | false
-- registrar_evento_purge            | uuid,text,jsonb,uuid| false | false | true
-- validar_eliminado_at_certificados |                  | false | false | false
--
-- Query 2: Test obligatorio del brief (ambas firmas deben fallar)
--
SET ROLE authenticated;
SELECT public.registrar_evento_purge(
  '00000000-0000-0000-0000-000000000000'::uuid, 'FAKE_EVENT', '{}'::jsonb
);
-- Esperado: ERROR "permission denied for function registrar_evento_purge" (v1)

SELECT public.registrar_evento_purge(
  '00000000-0000-0000-0000-000000000000'::uuid, 'FAKE_EVENT', '{}'::jsonb, NULL
);
-- Esperado: ERROR "permission denied for function registrar_evento_purge" (v2)

RESET ROLE;
--
-- Query 3: Validar que Edge Functions siguen funcionando
--
SET ROLE service_role;
SELECT public.registrar_evento_purge(
  '00000000-0000-0000-0000-000000000000'::uuid, 'TEST_EVENT', '{}'::jsonb, NULL
);
-- Esperado: La función se ejecuta (puede fallar por constraint de action,
-- pero NO por permisos)
RESET ROLE;
