-- ============================================================
-- F7-19: Auditoría de exportaciones (RBAC, PHI y auditabilidad)
-- ============================================================
--
-- CONTEXTO:
-- F7-08 (2026-08-31) eliminó las políticas INSERT del cliente en audit_log
-- para prevenir inyección de registros falsos. Sin embargo, esto rompió
-- registrarAuditoria() de exportService.js, que intentaba hacer INSERT
-- directo y fallaba silenciosamente.
--
-- SOLUCIÓN:
-- Crear RPC SECURITY DEFINER que:
--   1. Valida que el usuario esté autenticado
--   2. Obtiene clinica_id automáticamente de clinica_actual()
--   3. Inserta en audit_log bypassando RLS
--   4. Agrega 'EXPORT' como acción válida
--   5. Rate limiting: máximo 100 exportaciones por hora por usuario
--
-- PATRÓN:
-- Consistente con F7-11b (verificar_bootstrap_necesario, bootstrap_clinica)
-- y F7-08 (auditar_cambio trigger).
-- ============================================================

-- 1. Agregar 'EXPORT' al constraint de action en audit_log
-- ============================================================
ALTER TABLE public.audit_log
  DROP CONSTRAINT IF EXISTS audit_log_action_check;

ALTER TABLE public.audit_log
  ADD CONSTRAINT audit_log_action_check
  CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'CONFLICT_RESOLVED', 'EXPORT'));

-- 2. RPC: registrar_exportacion()
-- ============================================================
-- Registra una exportación de reporte en audit_log con clinica_id automático.
--
-- Parámetros:
--   p_formato: 'pdf' o 'excel'
--   p_tipo: 'completo', 'ranking' o 'rendimiento'
--   p_periodo: período del reporte (opcional, default 'sin_periodo')
--
-- Retorna: UUID del registro creado
--
-- Validaciones:
--   - Usuario autenticado
--   - Usuario tiene membresía activa en clínica actual
--   - Rate limiting: max 100 exportaciones por hora por usuario
--
CREATE OR REPLACE FUNCTION public.registrar_exportacion(
  p_formato text,
  p_tipo text,
  p_periodo text DEFAULT 'sin_periodo'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email text;
  v_clinica_id UUID;
  v_export_count INTEGER;
  v_record_id UUID;
  v_new_data jsonb;
BEGIN
  -- Validación: usuario autenticado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'NO_AUTENTICADO: debes iniciar sesión para exportar reportes';
  END IF;

  -- Obtener email del usuario
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  -- Validación: usuario tiene membresía activa en alguna clínica
  v_clinica_id := public.clinica_actual();
  IF v_clinica_id IS NULL THEN
    RAISE EXCEPTION 'SIN_CLINICA: debes seleccionar una clínica activa para exportar reportes';
  END IF;

  -- Validación: usuario es miembro activo de la clínica
  IF NOT EXISTS (
    SELECT 1 FROM public.miembros_clinica mc
    WHERE mc.user_id = v_user_id
      AND mc.clinica_id = v_clinica_id
      AND mc.activo = true
  ) THEN
    RAISE EXCEPTION 'NO_MIEMBRO: no tienes acceso a esta clínica';
  END IF;

  -- Rate limiting: máximo 100 exportaciones por hora por usuario
  SELECT COUNT(*) INTO v_export_count
  FROM public.audit_log
  WHERE user_id = v_user_id
    AND action = 'EXPORT'
    AND created_at >= NOW() - INTERVAL '1 hour';

  IF v_export_count >= 100 THEN
    RAISE EXCEPTION 'RATE_LIMIT: has alcanzado el límite de 100 exportaciones por hora. Espera antes de exportar nuevamente.';
  END IF;

  -- Validación: formato válido
  IF p_formato NOT IN ('pdf', 'excel') THEN
    RAISE EXCEPTION 'FORMATO_INVALIDO: formato debe ser pdf o excel';
  END IF;

  -- Validación: tipo válido
  IF p_tipo NOT IN ('completo', 'ranking', 'rendimiento') THEN
    RAISE EXCEPTION 'TIPO_INVALIDO: tipo debe ser completo, ranking o rendimiento';
  END IF;

  -- Construir new_data con metadata de la exportación
  v_new_data := jsonb_build_object(
    'formato', p_formato,
    'tipo', p_tipo,
    'periodo', p_periodo,
    'timestamp', NOW()
  );

  -- Generar UUID para record_id
  v_record_id := gen_random_uuid();

  -- Insertar en audit_log
  INSERT INTO public.audit_log (
    id,
    user_id,
    user_email,
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    resolution_strategy,
    clinica_id
  ) VALUES (
    v_record_id,
    v_user_id,
    v_user_email,
    'reportes',
    v_record_id::text,
    'EXPORT',
    NULL,
    v_new_data,
    NULL,
    v_clinica_id
  );

  RETURN v_record_id;
END;
$$;

-- 3. Comentarios y permisos
-- ============================================================
COMMENT ON FUNCTION public.registrar_exportacion(text, text, text) IS
  'F7-19: Registra exportación de reporte en audit_log con clinica_id automático. '
  'SECURITY DEFINER bypass RLS. Rate limiting: 100/hora por usuario. '
  'Usada por exportService.js para auditoría de exportaciones Excel/PDF.';

-- Grant: solo authenticated pueden ejecutar
REVOKE ALL ON FUNCTION public.registrar_exportacion(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_exportacion(text, text, text) TO authenticated;

-- 4. Verificación: auditar_cambio() trigger debe existir (de F6-F/F7-08)
-- ============================================================
-- No lo recreamos, solo verificamos que existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND routine_name = 'auditar_cambio'
  ) THEN
    RAISE WARNING 'F7-19: auditar_cambio() no existe. F7-08 debería haberla creado.';
  END IF;
END $$;
