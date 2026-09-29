-- F7-37 v2: Corrección de purge de certificados con eventual consistency
-- Migración 000700: Estado intermedio + cleanup + fail-closed
--
-- PROBLEMA DETECTADO:
-- purgar_certificados_expirados() hacía:
--   1. net.http_post() a archivos-purge (fire-and-forget)
--   2. DELETE inmediato de certificados
-- Si archivos-purge fallaba → objeto R2 quedaba huérfano permanentemente.
--
-- SOLUCIÓN:
-- Agregar estado intermedio 'purga_pendiente' y hacer DELETE físico SOLO
-- después de confirmar R2 en archivos-purge. Incluir cleanup para recovery.
--
-- Idempotente: puede ejecutarse múltiples veces sin error.
-- Fail-closed: validaciones con RAISE EXCEPTION.
-- ============================================================

-- ============================================================
-- 1. Agregar columna purga_pendiente a certificados
-- ============================================================
ALTER TABLE public.certificados
  ADD COLUMN IF NOT EXISTS purga_pendiente BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.certificados
  ADD COLUMN IF NOT EXISTS purga_iniciada_at TIMESTAMPTZ DEFAULT NULL;

-- Índice parcial: solo indexa filas con purga_pendiente=TRUE para performance
CREATE INDEX IF NOT EXISTS certificados_purga_pendiente_idx
  ON public.certificados (purga_pendiente, purga_iniciada_at)
  WHERE purga_pendiente = TRUE;

COMMENT ON COLUMN public.certificados.purga_pendiente IS
  'F7-37 v2: TRUE cuando el certificado está en proceso de purge de R2.';

COMMENT ON COLUMN public.certificados.purga_iniciada_at IS
  'F7-37 v2: Timestamp cuando se inició el purge (para cleanup de stale).';

-- ============================================================
-- 2. Reescribir purgar_certificados_expirados()
-- ============================================================
CREATE OR REPLACE FUNCTION public.purgar_certificados_expirados()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_cert RECORD;
  v_archivo_ids UUID[] := ARRAY[]::UUID[]::UUID[];
  v_source_ids JSONB := '{}'::jsonb;
  v_count INTEGER := 0;
  v_archivo_id UUID;
  v_supabase_url TEXT := 'https://nagduvivilmzupdpoayo.supabase.co';
  v_service_key TEXT;
BEGIN
  -- Leer internal_purge_secret (compartida con F7-32)
  SELECT value INTO v_service_key
  FROM public.system_config
  WHERE key = 'internal_purge_secret';

  IF v_service_key IS NULL OR v_service_key = '' THEN
    RAISE WARNING '[F7-37 v2] internal_purge_secret no configurada. Abortando purga.'
      USING HINT = 'INSERT INTO public.system_config (key, value) VALUES (''internal_purge_secret'', ''<SECRETO>'');';
    RETURN;
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
    v_archivo_id := (v_cert.datos->>'r2ArchivoId')::UUID;
    IF v_archivo_id IS NOT NULL THEN
      v_archivo_ids := array_append(v_archivo_ids, v_archivo_id);
      -- Mapear archivo_id -> certificado_id para que archivos-purge pueda borrar ambos
      v_source_ids := jsonb_set(v_source_ids, ARRAY[v_archivo_id::text], to_jsonb(v_cert.id));
    END IF;
    v_count := v_count + 1;
  END LOOP;

  IF v_count = 0 THEN
    RAISE NOTICE '[F7-37 v2] No hay certificados vencidos para purgar.';
    RETURN;
  END IF;

  RAISE NOTICE '[F7-37 v2] Marcando % certificados como purga_pendiente=TRUE', v_count;

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
      RAISE NOTICE '[F7-37 v2] Request encolada para % archivo(s) R2 con source_type=certificado.', array_length(v_archivo_ids, 1);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '[F7-37 v2] Error encolando R2: %. Cleanup reseteará purga_pendiente.', SQLERRM;
    END;
  ELSE
    -- Sin archivos R2: hacer DELETE directo (no hay R2 que purgar)
    DELETE FROM public.certificados
    WHERE purga_pendiente = TRUE
      AND purga_iniciada_at IS NOT NULL
      AND purga_iniciada_at < NOW() - INTERVAL '1 minute';
    RAISE NOTICE '[F7-37 v2] Certificados sin R2 eliminados directamente.';
  END IF;
END;
$function$;

COMMENT ON FUNCTION public.purgar_certificados_expirados() IS
  'F7-37 v2: Purga certificados con >730 días en papelera. Marca purga_pendiente=TRUE' 
  'y encola HTTP a archivos-purge con source_type=certificado. El DELETE físico solo' 
  'ocurre después de confirmar R2 en archivos-purge. Si R2 falla, cleanup resetea' 
  'purga_pendiente para retry.';

-- ============================================================
-- 3. Crear cleanup_stale_purges()
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_stale_purges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_reset_count INTEGER;
BEGIN
  -- Resetear certificados atascados en purga_pendiente=TRUE por > 24h
  UPDATE public.certificados
  SET purga_pendiente = FALSE,
      purga_iniciada_at = NULL
  WHERE purga_pendiente = TRUE
    AND purga_iniciada_at IS NOT NULL
    AND purga_iniciada_at < NOW() - INTERVAL '24 hours';

  GET DIAGNOSTICS v_reset_count = ROW_COUNT;

  IF v_reset_count > 0 THEN
    RAISE NOTICE '[F7-37 v2] Cleanup: % certificados reseteados para retry.', v_reset_count;
  ELSE
    RAISE NOTICE '[F7-37 v2] Cleanup: ningún certificado atascado.';
  END IF;
END;
$function$;

COMMENT ON FUNCTION public.cleanup_stale_purges() IS
  'F7-37 v2: Resetea certificados atascados en purga_pendiente=TRUE por >24h.' 
  'Esto permite que el próximo cron los reintente. SECURITY DEFINER, search_path vacío.';

-- ============================================================
-- 4. Programar cleanup en pg_cron (solo si pg_cron está disponible)
-- ============================================================
-- pg_cron NO está habilitado en todos los entornos (por ejemplo, en
-- Supabase local por defecto). Hacemos la programación condicional.
DO $$
DECLARE
  v_job_exists BOOLEAN;
  v_cron_available BOOLEAN;
BEGIN
  -- Verificar si el schema cron está disponible
  SELECT EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'cron'
  ) INTO v_cron_available;

  IF NOT v_cron_available THEN
    RAISE WARNING '[F7-37 v2] pg_cron no está disponible en este entorno. Job cleanup-stale-purges NO programado.'
      USING HINT = 'Habilitar pg_cron extension si se requiere programación automática.';
    RETURN;
  END IF;

  -- Verificar si el job ya existe
  SELECT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'cleanup-stale-purges'
  ) INTO v_job_exists;

  IF v_job_exists THEN
    PERFORM cron.unschedule('cleanup-stale-purges');
    RAISE NOTICE '[F7-37 v2] Job previo cleanup-stale-purges eliminado.';
  END IF;

  -- Programar: diario a las 4:00 AM (1 hora después del purge principal)
  PERFORM cron.schedule(
    'cleanup-stale-purges',
    '0 4 * * *',
    'SELECT cleanup_stale_purges()'
  );
  RAISE NOTICE '[F7-37 v2] Schedule creado: cleanup-stale-purges diario a las 4:00 AM';
END $$;

-- ============================================================
-- 5. Permisos: solo service_role / postgres
-- ============================================================
REVOKE ALL ON FUNCTION public.cleanup_stale_purges() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_stale_purges() FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_stale_purges() FROM authenticated;
REVOKE ALL ON FUNCTION public.cleanup_stale_purges() FROM service_role;

-- ============================================================
-- 6. Verificaciones fail-closed
-- ============================================================
DO $$
BEGIN
  -- Verificar que purga_pendiente existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'certificados'
      AND column_name = 'purga_pendiente'
  ) THEN
    RAISE EXCEPTION 'F7-37 v2: columna purga_pendiente no existe en certificados';
  END IF;

  -- Verificar que cleanup_stale_purges existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'cleanup_stale_purges'
  ) THEN
    RAISE EXCEPTION 'F7-37 v2: función cleanup_stale_purges no existe';
  END IF;

  RAISE NOTICE '[F7-37 v2] ✅ Todas las verificaciones pasaron';
END $$;