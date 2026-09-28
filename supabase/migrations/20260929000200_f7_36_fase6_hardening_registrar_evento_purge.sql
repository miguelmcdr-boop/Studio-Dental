-- ============================================================
-- F7-36 FASE 6 (Commit 6.2): Hardening de registrar_evento_purge
-- ============================================================
--
-- OBJETIVO:
-- Alinear registrar_evento_purge con el hardening de FASE 3
-- aplicado a registrar_evento_archivo:
-- - search_path = '' (vacio) en lugar de = public
-- - Permisos explicitos (REVOKE/GRANT) en lugar de PUBLIC por defecto
--
-- PROBLEMA DETECTADO:
-- registrar_evento_purge v2 (FASE 2, F7-33) resolvio el problema
-- de user_id = null agregando p_user_id como parametro, pero
-- NO incluyo las protecciones de FASE 3:
-- - search_path no estaba vacio (riesgo de hijacking)
-- - Permisos dependian de PUBLIC por defecto
--
-- CAMBIOS:
-- - AGREGAR: SET search_path = '' (alineado con FASE 3)
-- - AGREGAR: REVOKE ALL FROM PUBLIC
-- - AGREGAR: REVOKE EXECUTE FROM authenticated, anon
-- - AGREGAR: GRANT EXECUTE TO service_role
-- - PRESERVAR: Firma (4 args igual que v2 actual)
-- - PRESERVAR: Logica (COALESCE(p_user_id, auth.uid()))
-- - PRESERVAR: new_data sin PHI (no agrega nombre_archivo ni rut)
--
-- PRINCIPIO CONSERVADOR:
-- - NO tocar la logica de insercion
-- - NO tocar los campos de new_data
-- - Solo endurecer search_path y permisos
-- - Backward compatible: misma firma, mismo comportamiento
--
-- CALLERS LEGITIMOS (no afectados):
-- - pacientes-purge (Edge Function) -> usa service_role
-- - archivos-purge (Edge Function) -> usa service_role
-- - purga_automatica_archivos (pg_cron) -> usa service_role
--
-- VALIDACION POST-APLICACION:
--
-- Query 1: Confirmar search_path vacio y permisos
--
--   SELECT p.proname,
--          p.proconfig AS config,
--          has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_can_exec,
--          has_function_privilege('public', p.oid, 'EXECUTE') AS public_can_exec,
--          has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_can_exec
--   FROM pg_proc p
--   JOIN pg_namespace n ON p.pronamespace = n.oid
--   WHERE n.nspname = 'public' AND p.proname = 'registrar_evento_purge';
--
-- Esperado:
--   config = {search_path=}
--   auth_can_exec = false
--   public_can_exec = false
--   service_can_exec = true
--
-- Query 2: Validar que purga sigue funcionando
-- Subir archivo en app, purgarlo desde admin, verificar:
--
--   SELECT action, user_id, created_at
--   FROM audit_log
--   WHERE action = 'ADMIN_PURGE_ARCHIVOS'
--   ORDER BY created_at DESC LIMIT 1;
--
-- Esperado: user_id = UUID del admin que purgo
-- ============================================================

-- ============================================================
-- Reescribir registrar_evento_purge con search_path vacio
-- ============================================================
CREATE OR REPLACE FUNCTION public.registrar_evento_purge(
  p_clinica_id uuid,
  p_evento text,
  p_detalle jsonb DEFAULT '{}'::jsonb,
  p_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.audit_log (
    clinica_id,
    user_id,
    table_name,
    record_id,
    action,
    new_data
  ) VALUES (
    p_clinica_id,
    COALESCE(p_user_id, auth.uid()),
    'purge',
    COALESCE(p_detalle->>'paciente_id', p_detalle->>'archivo_id', 'purge'),
    p_evento,
    jsonb_build_object(
      'evento', p_evento,
      'detalle', p_detalle,
      'timestamp', NOW()
    )
  );
END;
$$;

-- ============================================================
-- Permisos restrictivos (alineado con FASE 2 y FASE 3)
-- ============================================================
REVOKE ALL ON FUNCTION public.registrar_evento_purge(uuid, text, jsonb, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.registrar_evento_purge(uuid, text, jsonb, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_evento_purge(uuid, text, jsonb, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.registrar_evento_purge(uuid, text, jsonb, uuid) TO service_role;

COMMENT ON FUNCTION public.registrar_evento_purge(uuid, text, jsonb, uuid) IS
  'F7-36 FASE 6: Registra eventos de purge permanente (ADMIN_PURGE_PACIENTES, '
  'ADMIN_PURGE_ARCHIVOS, AUTO_PURGE_ARCHIVOS) en audit_log. SECURITY DEFINER '
  'con search_path vacio (alineado con FASE 3). '
  'Permisos: SOLO service_role (Edge Functions pacientes-purge, archivos-purge, '
  'y purga_automatica_archivos via pg_cron). '
  'Parametro p_user_id (FASE 5): permite a las Edge Functions pasar el '
  'user_id real del admin que ejecuto la purga. Si es NULL, cae a auth.uid() '
  '(backward compatible). '
  'new_data contiene SOLO: evento, detalle (sin PHI), timestamp.';
