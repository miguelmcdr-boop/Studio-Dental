-- ============================================================
-- F7-36 FASE 2 (Commit 2.1): Endurecer permisos de registrar_evento_archivo
-- ============================================================
--
-- PROBLEMA (hallazgo de auditoría 2026-09-28):
-- La función registrar_evento_archivo(UUID, TEXT, JSONB) está definida
-- como SECURITY DEFINER pero NO tiene REVOKE FROM PUBLIC ni GRANT
-- explícito. Por defecto en PostgreSQL, PUBLIC puede ejecutar cualquier
-- función, lo que significa que cualquier usuario autenticado puede
-- invocar esta RPC vía Data API y fabricar eventos de auditoría falsos.
--
-- REGLA DEL BRIEF F7-36 FASE 2:
-- "RLS correcto ≠ RPC segura. RLS NO protege automáticamente la
-- ejecución de una función. Comprueba permisos de ejecución
-- explícitamente."
--
-- CALLER REAL (verificado en r2-upload-url, r2-download-url,
-- r2-delete, r2-restore):
-- Solo Edge Functions llaman a esta función usando
-- SUPABASE_SERVICE_ROLE_KEY. El frontend NUNCA llama directamente.
--
-- SOLUCIÓN (solo permisos, no tocar lógica):
-- 1. REVOKE EXECUTE FROM PUBLIC (elimina acceso por defecto)
-- 2. GRANT EXECUTE TO service_role (solo Edge Functions)
--
-- ALCANCE:
-- - Solo ajusta permisos (NO modifica lógica interna de la función)
-- - NO modifica SET search_path (eso corresponde a FASE 3)
-- - NO reescribe la función (idempotente por naturaleza de REVOKE/GRANT)
--
-- TEST OBLIGATORIO (Commit 2.4):
-- Usuario autenticado normal NO debe poder invocar la función vía
-- Data API. Debe recibir error 401/403.
-- ============================================================

-- 1. Revocar acceso público (defensivo, idempotente)
REVOKE ALL ON FUNCTION public.registrar_evento_archivo(UUID, TEXT, JSONB) FROM PUBLIC;

-- 2. Conceder solo al rol service_role (Edge Functions)
GRANT EXECUTE ON FUNCTION public.registrar_evento_archivo(UUID, TEXT, JSONB) TO service_role;

-- 3. Documentar el cambio en el comment de la función
COMMENT ON FUNCTION public.registrar_evento_archivo(UUID, TEXT, JSONB) IS
  'F7-36 FASE 2: Registra eventos de archivos clínicos (FILE_UPLOAD, FILE_DOWNLOAD, FILE_DELETE, FILE_RESTORE) en audit_log. '
  'SECURITY DEFINER. Permisos: solo service_role (Edge Functions). '
  'Usuario autenticado normal NO puede invocar esta función.';
