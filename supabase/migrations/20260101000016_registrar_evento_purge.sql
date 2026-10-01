-- ============================================================
-- Feature 1: Función SQL para registrar eventos de purge en audit_log
-- ============================================================
--
-- PROBLEMA: Las Edge Functions de purge (pacientes-purge, archivos-purge)
-- necesitan registrar eventos ADMIN_PURGE_* en audit_log, pero no existe
-- una función helper que lo haga con SECURITY DEFINER.
--
-- SOLUCIÓN: Crear registrar_evento_purge que inserta en audit_log con
-- action=p_evento (ya permitido por constraint de migración 15).
-- ============================================================

CREATE OR REPLACE FUNCTION registrar_evento_purge(
  p_clinica_id UUID,
  p_evento TEXT,
  p_detalle JSONB DEFAULT '{}'::jsonb
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
    auth.uid(),
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
  'Eventos: ADMIN_PURGE_PACIENTES, ADMIN_PURGE_ARCHIVOS.';

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_name = 'registrar_evento_purge';
