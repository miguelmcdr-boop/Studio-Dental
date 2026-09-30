-- F7-37 v4: Hardening de purga de certificados
-- Migración 000900: Corrección de H-11, H-10, H-11b
--
-- H-11: Dos queries SELECT con LIMIT 100 desalineadas
-- H-10: Certificados sin R2 atrapados en lotes mixtos
-- H-11b: UUID inválido sin cuarentena permanente
--
-- SOLUCIONES:
-- 1. Unificar queries en un solo array de IDs (H-11)
-- 2. Procesar certificados con/sin R2 en el mismo batch (H-10)
-- 3. Agregar cuarentena permanente para UUIDs inválidos (H-11b)
--
-- Idempotente: puede ejecutarse múltiples veces sin error.
-- Fail-closed: validaciones con RAISE EXCEPTION.
-- ============================================================

-- ============================================================
-- 1. Agregar columna cuarentena_until para H-11b
-- ============================================================
ALTER TABLE public.certificados
  ADD COLUMN IF NOT EXISTS cuarentena_until TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.certificados.cuarentena_until IS
  'F7-37 v4 (H-11b): Timestamp hasta el cual el certificado está en cuarentena.' 
  'Si NOT NULL, no será procesado por purgar_certificados_expirados() hasta esta fecha.' 
  'Usado para errores permanentes (UUID inválido) que no deben reintentarse indefinidamente.';

-- Índice parcial: solo indexa filas con cuarentena activa
CREATE INDEX IF NOT EXISTS certificados_cuarentena_until_idx
  ON public.certificados (cuarentena_until)
  WHERE cuarentena_until IS NOT NULL;

-- ============================================================
-- 2. Reescribir purgar_certificados_expirados() con fixes
-- ============================================================
CREATE OR REPLACE FUNCTION public.purgar_certificados_expirados()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_cert RECORD;
  v_selected_ids UUID[] := ARRAY[]::UUID[];
  v_archivo_ids UUID[] := ARRAY[]::UUID[];
  v_source_ids JSONB := '{}'::jsonb;
  v_archivo_id UUID;
  v_uuid_invalid_count INTEGER := 0;
  v_sin_r2_count INTEGER := 0;
  v_con_r2_count INTEGER := 0;
  v_supabase_url TEXT;
  v_service_key TEXT;
BEGIN
  -- Leer internal_purge_secret (compartida con F7-32)
  SELECT value INTO v_service_key
  FROM public.system_config
  WHERE key = 'internal_purge_secret';

  IF v_service_key IS NULL OR v_service_key = '' THEN
    RAISE WARNING '[F7-37 v4] internal_purge_secret no configurada. Abortando purga.'
      USING HINT = 'INSERT INTO public.system_config (key, value) VALUES (''internal_purge_secret'', ''<SECRETO>'');';
    RETURN;
  END IF;

  -- F7-37 v3.2 hardening: Obtener URL de Supabase dinámicamente con fallback seguro
  SELECT value INTO v_supabase_url
  FROM public.system_config
  WHERE key = 'supabase_url';

  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    v_supabase_url := 'https://nagduvivilmzupdpoayo.supabase.co';
    RAISE NOTICE '[F7-37 v4] supabase_url no configurada. Usando fallback de producción.'
      USING HINT = 'INSERT INTO public.system_config (key, value) VALUES (''supabase_url'', ''<URL_ENTORNO>'');';
  END IF;

  -- ============================================================
  -- H-11 FIX: Unificar selección en un solo array
  -- Seleccionar IDs UNA sola vez y almacenar en array
  -- ============================================================
  SELECT array_agg(id) INTO v_selected_ids
  FROM (
    SELECT id FROM public.certificados
    WHERE eliminado_at IS NOT NULL
      AND eliminado_at < NOW() - INTERVAL '730 days'
      AND purga_pendiente = FALSE
      AND (cuarentena_until IS NULL OR cuarentena_until < NOW())
    ORDER BY eliminado_at ASC
    LIMIT 100
  ) AS batch;

  IF v_selected_ids IS NULL OR array_length(v_selected_ids, 1) = 0 THEN
    RAISE NOTICE '[F7-37 v4] No hay certificados vencidos para purgar.';
    RETURN;
  END IF;

  RAISE NOTICE '[F7-37 v4] Procesando % certificados del batch', array_length(v_selected_ids, 1);

  -- Marcar todos los seleccionados como purga_pendiente=TRUE (usando el mismo array)
  UPDATE public.certificados
  SET purga_pendiente = TRUE,
      purga_iniciada_at = NOW()
  WHERE id = ANY(v_selected_ids);

  -- ============================================================
  -- Procesar cada certificado del batch
  -- H-10 FIX: Separar con/sin R2 dentro del mismo batch
  -- ============================================================
  FOR v_cert IN
    SELECT id, clinica_id, datos
    FROM public.certificados
    WHERE id = ANY(v_selected_ids)
  LOOP
    BEGIN
      v_archivo_id := NULL;
      IF v_cert.datos IS NOT NULL AND (v_cert.datos->>'r2ArchivoId') IS NOT NULL THEN
        v_archivo_id := (v_cert.datos->>'r2ArchivoId')::UUID;
      END IF;

      IF v_archivo_id IS NOT NULL THEN
        -- Certificado con R2 válido → agregar a array para archivos-purge
        v_archivo_ids := array_append(v_archivo_ids, v_archivo_id);
        v_source_ids := jsonb_set(v_source_ids, ARRAY[v_archivo_id::text], to_jsonb(v_cert.id));
        v_con_r2_count := v_con_r2_count + 1;
      ELSE
        -- Certificado sin R2 → DELETE inmediato
        DELETE FROM public.certificados WHERE id = v_cert.id;
        v_sin_r2_count := v_sin_r2_count + 1;
      END IF;
    EXCEPTION
      WHEN invalid_text_representation OR data_exception THEN
        -- H-11b FIX: UUID inválido → cuarentena permanente (30 días)
        v_uuid_invalid_count := v_uuid_invalid_count + 1;
        RAISE WARNING '[F7-37 v4] Certificado % tiene r2ArchivoId inválido. Cuarentena 30 días.', v_cert.id;
        UPDATE public.certificados
        SET purga_pendiente = FALSE,
            purga_iniciada_at = NULL,
            cuarentena_until = NOW() + INTERVAL '30 days',
            eliminado_motivo = COALESCE(eliminado_motivo, '') || ' [UUID inválido en purga - cuarentena]'
        WHERE id = v_cert.id;
        CONTINUE;
      WHEN OTHERS THEN
        RAISE WARNING '[F7-37 v4] Error procesando certificado %: %', v_cert.id, SQLERRM;
        -- Resetear purga_pendiente para retry en próximo batch
        UPDATE public.certificados
        SET purga_pendiente = FALSE,
            purga_iniciada_at = NULL
        WHERE id = v_cert.id;
        CONTINUE;
    END;
  END LOOP;

  -- Log de resumen del batch
  IF v_uuid_invalid_count > 0 THEN
    RAISE NOTICE '[F7-37 v4] % certificados con UUID inválido → cuarentena 30 días.', v_uuid_invalid_count;
  END IF;
  IF v_sin_r2_count > 0 THEN
    RAISE NOTICE '[F7-37 v4] % certificados sin R2 eliminados directamente.', v_sin_r2_count;
  END IF;

  -- ============================================================
  -- Encolar HTTP a archivos-purge para certificados con R2
  -- ============================================================
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
      RAISE NOTICE '[F7-37 v4] Request encolada para % archivo(s) R2.', array_length(v_archivo_ids, 1);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '[F7-37 v4] Error encolando R2: %. Cleanup reseteará purga_pendiente.', SQLERRM;
    END;
  END IF;

  RAISE NOTICE '[F7-37 v4] Batch completado: % con R2, % sin R2, % UUID inválido.',
    v_con_r2_count, v_sin_r2_count, v_uuid_invalid_count;
END;
$function$;

COMMENT ON FUNCTION public.purgar_certificados_expirados() IS
  'F7-37 v4: Purga certificados vencidos con fixes de H-11, H-10, H-11b.' 
  'H-11: Unifica selección en un solo array. ' 
  'H-10: Procesa certificados con/sin R2 en el mismo batch. ' 
  'H-11b: UUID inválido → cuarentena 30 días. ' 
  'SECURITY DEFINER, search_path vacío.';

-- ============================================================
-- 3. Reescribir cleanup_stale_purges() para respetar cuarentena
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_stale_purges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_reset_count INTEGER;
  v_cuarentena_count INTEGER;
BEGIN
  -- Resetear certificados atascados en purga_pendiente=TRUE por > 24h
  -- H-11b FIX: NO resetear si tienen cuarentena_until activa
  UPDATE public.certificados
  SET purga_pendiente = FALSE,
      purga_iniciada_at = NULL
  WHERE purga_pendiente = TRUE
    AND purga_iniciada_at IS NOT NULL
    AND purga_iniciada_at < NOW() - INTERVAL '24 hours'
    AND (cuarentena_until IS NULL OR cuarentena_until < NOW());

  GET DIAGNOSTICS v_reset_count = ROW_COUNT;

  -- Contar certificados en cuarentena activa
  SELECT COUNT(*) INTO v_cuarentena_count
  FROM public.certificados
  WHERE cuarentena_until IS NOT NULL
    AND cuarentena_until > NOW();

  IF v_reset_count > 0 THEN
    RAISE NOTICE '[F7-37 v4] Cleanup: % certificados reseteados para retry.', v_reset_count;
  ELSE
    RAISE NOTICE '[F7-37 v4] Cleanup: ningún certificado atascado (sin cuarentena).';
  END IF;

  IF v_cuarentena_count > 0 THEN
    RAISE NOTICE '[F7-37 v4] Cleanup: % certificados en cuarentena activa (no reseteados).', v_cuarentena_count;
  END IF;
END;
$function$;

COMMENT ON FUNCTION public.cleanup_stale_purges() IS
  'F7-37 v4: Resetea certificados atascados en purga_pendiente=TRUE por >24h.' 
  'H-11b FIX: NO resetea certificados con cuarentena_until activa.' 
  'SECURITY DEFINER, search_path vacío.';

-- ============================================================
-- 4. Permisos: solo service_role / postgres
-- ============================================================
REVOKE ALL ON FUNCTION public.cleanup_stale_purges() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_stale_purges() FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_stale_purges() FROM authenticated;
REVOKE ALL ON FUNCTION public.cleanup_stale_purges() FROM service_role;

-- ============================================================
-- 5. Verificaciones fail-closed
-- ============================================================
DO $$
BEGIN
  -- Verificar que columna cuarentena_until existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'certificados'
      AND column_name = 'cuarentena_until'
  ) THEN
    RAISE EXCEPTION 'F7-37 v4: columna cuarentena_until no existe en certificados';
  END IF;

  -- Verificar que purgar_certificados_expirados tiene search_path vacío
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'purgar_certificados_expirados'
      AND 'search_path=""' = ANY(p.proconfig)
  ) THEN
    RAISE EXCEPTION 'F7-37 v4: purgar_certificados_expirados no tiene search_path vacío';
  END IF;

  -- Verificar que cleanup_stale_purges tiene search_path vacío
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'cleanup_stale_purges'
      AND 'search_path=""' = ANY(p.proconfig)
  ) THEN
    RAISE EXCEPTION 'F7-37 v4: cleanup_stale_purges no tiene search_path vacío';
  END IF;

  RAISE NOTICE '[F7-37 v4] ✅ Todas las verificaciones pasaron';
END $$;
