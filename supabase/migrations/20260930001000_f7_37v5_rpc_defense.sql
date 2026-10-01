-- F7-37 v5: Defensa en profundidad de RPC + flujo certificado sin archivo
-- Migración 001000: Dos cambios acotados
--
-- P1 #2: RPC purgar_archivo_y_certificado rechaza purga genérica
--        si el archivo está vinculado a algún certificado (datos.r2ArchivoId)
--
-- H-12: Nueva RPC eliminar_certificado_sin_archivo() para flujo coherente
--        del frontend vía archivos-purge
--
-- Idempotente: usa CREATE OR REPLACE y IF NOT EXISTS.
-- Fail-closed: validaciones con RAISE EXCEPTION.
-- ============================================================

-- ============================================================
-- 1. REESCRIBIR purgar_archivo_y_certificado con defensa de vínculo
-- ============================================================
CREATE OR REPLACE FUNCTION public.purgar_archivo_y_certificado(
  p_archivo_id UUID,
  p_certificado_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_archivo RECORD;
  v_certificado RECORD;
  v_r2_archivo_id UUID;
  v_vinculado BOOLEAN;
BEGIN
  -- Validación 1: archivo existe
  SELECT id, clinica_id, estado
    INTO v_archivo
    FROM public.archivos_clinicos
   WHERE id = p_archivo_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('exito', false, 'razon', 'archivo_inexistente');
  END IF;

  -- Validación 2: archivo en papelera (estado eliminado)
  IF v_archivo.estado <> 'eliminado' THEN
    RETURN jsonb_build_object('exito', false, 'razon', 'archivo_no_en_papelera');
  END IF;

  -- ============================================================
  -- F7-37 v5 P1 #2 FIX: Si p_certificado_id IS NULL (purga genérica),
  -- verificar que NINGÚN certificado (misma clínica) referencie
  -- este archivo mediante datos->>'r2ArchivoId'.
  -- Esto previene referencias rotas: certificado sobreviviente
  -- apuntando a archivo eliminado.
  -- ============================================================
  IF p_certificado_id IS NULL THEN
    -- Buscar certificados de la misma clínica que referencien este archivo
    SELECT EXISTS (
      SELECT 1
        FROM public.certificados
       WHERE clinica_id = v_archivo.clinica_id
         AND datos->>'r2ArchivoId' = p_archivo_id::text
    ) INTO v_vinculado;

    IF v_vinculado THEN
      RETURN jsonb_build_object(
        'exito', false,
        'razon', 'archivo_vinculado_a_certificado',
        'archivo_id', p_archivo_id
      );
    END IF;

    -- Purga genérica segura: archivo no vinculado a ningún certificado
    DELETE FROM public.archivos_clinicos WHERE id = p_archivo_id;
    RETURN jsonb_build_object('exito', true, 'archivo_eliminado', p_archivo_id);
  END IF;

  -- ============================================================
  -- Flujo certificado+archivo (existente, preservado)
  -- ============================================================

  -- Validación 3: certificado existe
  SELECT id, clinica_id, datos
    INTO v_certificado
    FROM public.certificados
   WHERE id = p_certificado_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('exito', false, 'razon', 'certificado_inexistente');
  END IF;

  -- Validación 4: misma clinica (previene cross-tenant)
  IF v_certificado.clinica_id <> v_archivo.clinica_id THEN
    RETURN jsonb_build_object('exito', false, 'razon', 'certificado_cross_tenant');
  END IF;

  -- Validación 5: relación r2ArchivoId = archivo.id
  v_r2_archivo_id := (v_certificado.datos->>'r2ArchivoId')::UUID;
  IF v_r2_archivo_id IS NULL OR v_r2_archivo_id <> p_archivo_id THEN
    RETURN jsonb_build_object('exito', false, 'razon', 'certificado_no_referencia_archivo');
  END IF;

  -- Transacción atómica: eliminar ambos
  DELETE FROM public.archivos_clinicos WHERE id = p_archivo_id;
  DELETE FROM public.certificados WHERE id = p_certificado_id;

  RETURN jsonb_build_object(
    'exito', true,
    'archivo_eliminado', p_archivo_id,
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

COMMENT ON FUNCTION public.purgar_archivo_y_certificado(UUID, UUID) IS
  'F7-37 v5: RPC transaccional para eliminar archivo + certificado atómicamente.'
  'v5 agrega defensa: si p_certificado_id IS NULL, RECHAZA si algún certificado'
  'de la misma clínica referencia el archivo vía datos->>r2ArchivoId.'
  'SECURITY DEFINER, search_path vacío. Solo service_role puede ejecutar.';

-- ============================================================
-- 2. NUEVA RPC: eliminar_certificado_sin_archivo
-- ============================================================
CREATE OR REPLACE FUNCTION public.eliminar_certificado_sin_archivo(
  p_certificado_id UUID
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
  -- Validación 1: certificado existe
  SELECT id, clinica_id, datos, eliminado_at
    INTO v_certificado
    FROM public.certificados
   WHERE id = p_certificado_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('exito', false, 'razon', 'certificado_inexistente');
  END IF;

  -- Validación 2: certificado debe estar en papelera (eliminado_at IS NOT NULL)
  IF v_certificado.eliminado_at IS NULL THEN
    RETURN jsonb_build_object('exito', false, 'razon', 'certificado_no_en_papelera');
  END IF;

  -- Validación 3: certificado NO debe tener r2ArchivoId
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

COMMENT ON FUNCTION public.eliminar_certificado_sin_archivo(UUID) IS
  'F7-37 v5 H-12: RPC para eliminar certificado sin archivo vinculado.'
  'Valida: certificado existe, está en papelera, NO tiene r2ArchivoId.'
  'Llamada desde archivos-purge cuando source_type=certificado y archivo_ids=[].'
  'SECURITY DEFINER, search_path vacío. Solo service_role puede ejecutar.';

-- ============================================================
-- 3. Permisos restrictivos (preservar política existente)
-- ============================================================
REVOKE ALL ON FUNCTION public.purgar_archivo_y_certificado(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purgar_archivo_y_certificado(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.purgar_archivo_y_certificado(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.purgar_archivo_y_certificado(UUID, UUID) TO service_role;

REVOKE ALL ON FUNCTION public.eliminar_certificado_sin_archivo(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.eliminar_certificado_sin_archivo(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.eliminar_certificado_sin_archivo(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.eliminar_certificado_sin_archivo(UUID) TO service_role;

-- ============================================================
-- 4. Verificaciones fail-closed
-- ============================================================
DO $$
BEGIN
  -- Verificar que purgar_archivo_y_certificado tiene search_path vacío
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'purgar_archivo_y_certificado'
      AND 'search_path=""' = ANY(p.proconfig)
  ) THEN
    RAISE EXCEPTION 'F7-37 v5: purgar_archivo_y_certificado no tiene search_path vacío';
  END IF;

  -- Verificar que eliminar_certificado_sin_archivo existe y tiene search_path vacío
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'eliminar_certificado_sin_archivo'
      AND 'search_path=""' = ANY(p.proconfig)
  ) THEN
    RAISE EXCEPTION 'F7-37 v5: eliminar_certificado_sin_archivo no existe o no tiene search_path vacío';
  END IF;

  RAISE NOTICE '[F7-37 v5] ✅ Migración 001000 aplicada correctamente';
END $$;
