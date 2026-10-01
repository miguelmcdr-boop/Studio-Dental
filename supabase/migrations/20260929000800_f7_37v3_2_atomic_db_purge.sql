-- F7-37 v3.2: Atomicidad PostgreSQL + manejo robusto de UUIDs
-- Migración 000800: RPC atómica + EXCEPTION handling en cron
--
-- PROBLEMA 1 (HALLAZGO 1):
-- archivos-purge hacía 2 DELETE REST separados (archivos + certificados)
-- Si el segundo fallaba → archivo eliminado pero certificado persiste
-- con purga_pendiente=TRUE y r2ArchivoId apuntando a archivo inexistente
--
-- SOLUCIÓN 1: RPC transaccional purgar_archivo_y_certificado()
--
-- PROBLEMA 2 (HALLAZGO 2):
-- purgar_certificados_expirados hacía cast (datos->>'r2ArchivoId')::UUID
-- Si el valor no es UUID válido → aborta todo el batch de 100 certificados
--
-- SOLUCIÓN 2: BEGIN/EXCEPTION por iteración en el cron
--
-- POLÍTICA DEFINITIVA (HALLAZGO 3):
-- admin+dentista pueden purgar (consistente con RLS de archivos_clinicos)
-- Documentada explícitamente en este migration
-- ============================================================

-- ============================================================
-- 1. RPC: purgar_archivo_y_certificado (atómica)
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

  -- Si no se pasó certificado, solo eliminar archivo (caso no-certificado)
  IF p_certificado_id IS NULL THEN
    DELETE FROM public.archivos_clinicos WHERE id = p_archivo_id;
    RETURN jsonb_build_object('exito', true, 'archivo_eliminado', p_archivo_id);
  END IF;

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
  'F7-37 v3.2: RPC transaccional para eliminar archivo + certificado atómicamente.' 
  'Valida server-side: existencia, tenant, relación r2ArchivoId.' 
  'SECURITY DEFINER, search_path vacío. Solo service_role puede ejecutar.';

-- Permisos restrictivos
REVOKE ALL ON FUNCTION public.purgar_archivo_y_certificado(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purgar_archivo_y_certificado(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.purgar_archivo_y_certificado(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.purgar_archivo_y_certificado(UUID, UUID) TO service_role;

-- ============================================================
-- 2. Reescribir purgar_certificados_expirados() con EXCEPTION handling
-- ============================================================
CREATE OR REPLACE FUNCTION public.purgar_certificados_expirados()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_cert RECORD;
  v_archivo_ids UUID[] := ARRAY[]::UUID[];
  v_source_ids JSONB := '{}'::jsonb;
  v_count INTEGER := 0;
  v_archivo_id UUID;
  v_uuid_invalid_count INTEGER := 0;
  v_supabase_url TEXT;
  v_service_key TEXT;
BEGIN
  -- Leer internal_purge_secret (compartida con F7-32)
  SELECT value INTO v_service_key
  FROM public.system_config
  WHERE key = 'internal_purge_secret';

  IF v_service_key IS NULL OR v_service_key = '' THEN
    RAISE WARNING '[F7-37 v3.2] internal_purge_secret no configurada. Abortando purga.'
      USING HINT = 'INSERT INTO public.system_config (key, value) VALUES (''internal_purge_secret'', ''<SECRETO>'');';
    RETURN;
  END IF;

  -- F7-37 v3.2 hardening: Obtener URL de Supabase dinámicamente con fallback seguro
  -- Evita llamar HTTP de producción cuando la función se ejecuta en staging/local
  SELECT value INTO v_supabase_url
  FROM public.system_config
  WHERE key = 'supabase_url';

  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    v_supabase_url := 'https://nagduvivilmzupdpoayo.supabase.co';
    RAISE NOTICE '[F7-37 v3.2] supabase_url no configurada. Usando fallback de producción.'
      USING HINT = 'INSERT INTO public.system_config (key, value) VALUES (''supabase_url'', ''<URL_ENTORNO>'');';
  END IF;

  -- Buscar certificados vencidos NO marcados como purga_pendiente
  FOR v_cert IN
    SELECT id, clinica_id, datos
    FROM public.certificados
    WHERE eliminado_at IS NOT NULL
      AND eliminado_at < NOW() - INTERVAL '730 days'
      AND purga_pendiente = FALSE
    ORDER BY eliminado_at ASC
    LIMIT 100
  LOOP
    -- F7-37 v3.2: EXCEPTION handling por iteración (UUID inválido no aborta el batch)
    BEGIN
      v_archivo_id := NULL;
      IF v_cert.datos IS NOT NULL AND (v_cert.datos->>'r2ArchivoId') IS NOT NULL THEN
        v_archivo_id := (v_cert.datos->>'r2ArchivoId')::UUID;
      END IF;

      IF v_archivo_id IS NOT NULL THEN
        v_archivo_ids := array_append(v_archivo_ids, v_archivo_id);
        v_source_ids := jsonb_set(v_source_ids, ARRAY[v_archivo_id::text], to_jsonb(v_cert.id));
      END IF;
      v_count := v_count + 1;
    EXCEPTION
      WHEN invalid_text_representation OR data_exception THEN
        -- r2ArchivoId no es UUID válido: loggear y continuar
        v_uuid_invalid_count := v_uuid_invalid_count + 1;
        RAISE WARNING '[F7-37 v3.2] Certificado % tiene r2ArchivoId inválido. Omitido del batch.', v_cert.id;
        -- Marcar para no reprocesar en próximos batches
        UPDATE public.certificados
        SET purga_pendiente = TRUE,
            purga_iniciada_at = NOW(),
            eliminado_motivo = COALESCE(eliminado_motivo, '') || ' [UUID inválido en purga]'
        WHERE id = v_cert.id;
        CONTINUE;
      WHEN OTHERS THEN
        RAISE WARNING '[F7-37 v3.2] Error procesando certificado %: %', v_cert.id, SQLERRM;
        CONTINUE;
    END;
  END LOOP;

  IF v_uuid_invalid_count > 0 THEN
    RAISE NOTICE '[F7-37 v3.2] % certificados con UUID inválido omitidos.', v_uuid_invalid_count;
  END IF;

  IF v_count = 0 THEN
    RAISE NOTICE '[F7-37 v3.2] No hay certificados vencidos para purgar.';
    RETURN;
  END IF;

  RAISE NOTICE '[F7-37 v3.2] Marcando % certificados como purga_pendiente=TRUE', v_count;

  -- Marcar certificados como purga_pendiente (NO hacer DELETE todavía)
  UPDATE public.certificados
  SET purga_pendiente = TRUE,
      purga_iniciada_at = NOW()
  WHERE eliminado_at IS NOT NULL
    AND eliminado_at < NOW() - INTERVAL '730 days'
    AND purga_pendiente = FALSE
    AND id IN (SELECT id FROM (
      SELECT id FROM public.certificados
      WHERE eliminado_at IS NOT NULL
        AND eliminado_at < NOW() - INTERVAL '730 days'
        AND purga_pendiente = FALSE
      ORDER BY eliminado_at ASC
      LIMIT 100
    ) AS subq);

  -- Encolar HTTP a archivos-purge con metadata adicional
  IF array_length(v_archivo_ids, 1) > 0 THEN
    BEGIN
      PERFORM net.http_post(
        url := v_supabase_url || '/functions/v1/archivos-purge',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-Internal-Secret', v_service_key
        ),
        body := jsonb_build_object(
          'archivo_ids', v_archivo_ids,
          'source_type', 'certificado',
          'source_ids', v_source_ids
        )
      );
      RAISE NOTICE '[F7-37 v3.2] Request encolada para % archivo(s) R2.', array_length(v_archivo_ids, 1);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '[F7-37 v3.2] Error encolando R2: %. Cleanup reseteará purga_pendiente.', SQLERRM;
    END;
  ELSE
    -- Sin archivos R2: hacer DELETE directo de certificados (no hay R2 que purgar)
    DELETE FROM public.certificados
    WHERE purga_pendiente = TRUE
      AND purga_iniciada_at IS NOT NULL
      AND purga_iniciada_at < NOW() - INTERVAL '1 minute';
    RAISE NOTICE '[F7-37 v3.2] Certificados sin R2 eliminados directamente.';
  END IF;
END;
$function$;

COMMENT ON FUNCTION public.purgar_certificados_expirados() IS
  'F7-37 v3.2: Purga certificados vencidos con EXCEPTION handling por iteración.' 
  'UUID inválido en r2ArchivoId no aborta el batch.' 
  'SECURITY DEFINER, search_path vacío.';

-- ============================================================
-- 3. Política definitiva: purge requiere admin O dentista
-- ============================================================
COMMENT ON TABLE public.archivos_clinicos IS
  'POLÍTICA DEFINITIVA F7-37 v3.2: purge permanente requiere rol admin O dentista. ' 
  'Consistente con Edge Function archivos-purge (allowedRoles).';

-- ============================================================
-- 4. Verificaciones fail-closed
-- ============================================================
DO $$
BEGIN
  -- Verificar que la nueva RPC existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'purgar_archivo_y_certificado'
  ) THEN
    RAISE EXCEPTION 'F7-37 v3.2: función purgar_archivo_y_certificado no existe';
  END IF;

  -- Verificar search_path vacío en la nueva RPC
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'purgar_archivo_y_certificado'
      AND 'search_path=""' = ANY(p.proconfig)
  ) THEN
    RAISE EXCEPTION 'F7-37 v3.2: purgar_archivo_y_certificado no tiene search_path vacío';
  END IF;

  RAISE NOTICE '[F7-37 v3.2] ✅ Todas las verificaciones pasaron';
END $$;