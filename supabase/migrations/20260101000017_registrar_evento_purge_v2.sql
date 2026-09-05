-- ============================================================
-- F7-33 Fix 1: registrar_evento_purge v2 con user_id explícito
-- ============================================================
--
-- PROBLEMA: La v1 usaba auth.uid() para obtener el user_id,
-- pero cuando la Edge Function llama con SUPABASE_SERVICE_ROLE_KEY,
-- auth.uid() retorna NULL, dejando el audit_log sin trazabilidad
-- del admin que ejecutó la purga.
--
-- SOLUCIÓN: Agregar parámetro p_user_id UUID que las Edge Functions
-- pasan explícitamente desde el JWT decodificado del admin.
-- Mantiene compatibilidad con DEFAULT NULL para no romper llamadas
-- antiguas durante el transition.
-- ============================================================

CREATE OR REPLACE FUNCTION registrar_evento_purge(
  p_clinica_id UUID,
  p_evento TEXT,
  p_detalle JSONB DEFAULT '{}'::jsonb,
  p_user_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO audit_log (
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION registrar_evento_purge IS 
  'Registra eventos de purge permanente en audit_log. '
  'Eventos: ADMIN_PURGE_PACIENTES, ADMIN_PURGE_ARCHIVOS. '
  'v2: recibe user_id explícito del admin (corrige NULL en audit_log).';

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- SELECT proname, pronargs FROM pg_proc WHERE proname = 'registrar_evento_purge';
