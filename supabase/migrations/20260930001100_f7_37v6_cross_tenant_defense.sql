-- F7-37 v6: Defensa cross-tenant en eliminar_certificado_sin_archivo
-- Migración 001100: Agregar p_clinica_id a la RPC para defensa en profundidad
--
-- P1 cross-tenant: RPC SECURITY DEFINER debe validar explícitamente que el
-- certificado pertenece a la clínica del usuario que solicita la purga.
-- No confiar exclusivamente en validaciones previas del Edge Function.
--
-- Idempotente: usa CREATE OR REPLACE FUNCTION.
-- Fail-closed: cualquier mismatch de clínica → REJECT, 0 DELETE.
-- ============================================================

-- ============================================================
-- 1. REESCRIBIR eliminar_certificado_sin_archivo con validación de tenant
-- ============================================================

-- F7-37 v6 P0 FIX: Eliminar la función vieja de 1 parámetro (sin tenant check)
-- PostgreSQL permite sobrecarga, por lo que CREATE OR REPLACE no la reemplaza.
-- Si queda viva, cualquier cliente puede llamarla con 1 parámetro y bypasear
-- la validación cross-tenant. Debe eliminarse explícitamente.
DROP FUNCTION IF EXISTS public.eliminar_certificado_sin_archivo(UUID);

CREATE OR REPLACE FUNCTION public.eliminar_certificado_sin_archivo(
  p_certificado_id UUID,
  p_clinica_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_certificado RECORD;
  v_r2_archivo_id TEXT;
BEGIN
  -- Validación 1: parámetros requeridos
  IF p_certificado_id IS NULL THEN
    RETURN jsonb_build_object('exito', false, 'razon', 'certificado_id_requerido');
  END IF;

  IF p_clinica_id IS NULL THEN
    RETURN jsonb_build_object('exito', false, 'razon', 'clinica_id_requerido');
  END IF;

  -- Validación 2: certificado existe
  SELECT id, clinica_id, datos, eliminado_at
    INTO v_certificado
    FROM public.certificados
   WHERE id = p_certificado_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('exito', false, 'razon', 'certificado_inexistente');
  END IF;

  -- ============================================================
  -- F7-37 v6 P1 FIX: Validación cross-tenant explícita
  -- El certificado DEBE pertenecer a la clínica del usuario.
  -- Un mismatch jamás produce DELETE.
  -- ============================================================
  IF v_certificado.clinica_id <> p_clinica_id THEN
    RETURN jsonb_build_object(
      'exito', false,
      'razon', 'certificado_cross_tenant',
      'certificado_id', p_certificado_id
    );
  END IF;

  -- Validación 3: certificado debe estar en papelera (eliminado_at IS NOT NULL)
  IF v_certificado.eliminado_at IS NULL THEN
    RETURN jsonb_build_object('exito', false, 'razon', 'certificado_no_en_papelera');
  END IF;

  -- Validación 4: certificado NO debe tener r2ArchivoId
  -- (si tiene, debe usarse la ruta normal vía archivos-purge con archivo)
  v_r2_archivo_id := v_certificado.datos->>'r2ArchivoId';
  IF v_r2_archivo_id IS NOT NULL AND v_r2_archivo_id <> '' THEN
    RETURN jsonb_build_object(
      'exito', false,
      'razon', 'certificado_tiene_archivo_vinculado',
      'archivo_id', v_r2_archivo_id
    );
  END IF;

  -- DELETE atómico del certificado
  DELETE FROM public.certificados WHERE id = p_certificado_id;

  RETURN jsonb_build_object(
    'exito', true,
    'certificado_eliminado', p_certificado_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'exito', false,
      'razon', 'error_db_transaccional',
      'mensaje', SQLERRM
    );
END;
$function$;

COMMENT ON FUNCTION public.eliminar_certificado_sin_archivo(UUID, UUID) IS
  'F7-37 v6: RPC para eliminar certificado sin archivo vinculado.'
  'v6 agrega validación cross-tenant: p_clinica_id debe coincidir con certificado.clinica_id.'
  'SECURITY DEFINER, search_path vacío. Solo service_role puede ejecutar.';

-- ============================================================
-- 2. Permisos restrictivos (preservar política existente)
-- ============================================================
REVOKE ALL ON FUNCTION public.eliminar_certificado_sin_archivo(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.eliminar_certificado_sin_archivo(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.eliminar_certificado_sin_archivo(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.eliminar_certificado_sin_archivo(UUID, UUID) TO service_role;

-- ============================================================
-- 3. Verificaciones fail-closed
-- ============================================================
DO $$
BEGIN
  -- Verificar que la RPC tiene search_path vacío
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'eliminar_certificado_sin_archivo'
      AND 'search_path=""' = ANY(p.proconfig)
  ) THEN
    RAISE EXCEPTION 'F7-37 v6: eliminar_certificado_sin_archivo no tiene search_path vacío';
  END IF;

  -- Verificar que la firma tiene 2 parámetros
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'eliminar_certificado_sin_archivo'
      AND p.pronargs = 2
  ) THEN
    RAISE EXCEPTION 'F7-37 v6: eliminar_certificado_sin_archivo debe tener 2 parámetros';
  END IF;

  -- Verificar permisos restrictivos
  IF has_function_privilege('anon', 'public.eliminar_certificado_sin_archivo(uuid, uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'F7-37 v6: anon no debe tener EXECUTE';
  END IF;

  IF has_function_privilege('authenticated', 'public.eliminar_certificado_sin_archivo(uuid, uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'F7-37 v6: authenticated no debe tener EXECUTE';
  END IF;

  IF NOT has_function_privilege('service_role', 'public.eliminar_certificado_sin_archivo(uuid, uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'F7-37 v6: service_role debe tener EXECUTE';
  END IF;

  RAISE NOTICE '[F7-37 v6] ✅ Migración 001100 aplicada correctamente: defensa cross-tenant en eliminar_certificado_sin_archivo';
END $$;
