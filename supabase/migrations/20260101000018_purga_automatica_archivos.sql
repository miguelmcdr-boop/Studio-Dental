-- ============================================================
-- F7-32: Purga automática de archivos en papelera (30 días)
-- ============================================================
--
-- PROBLEMA: Los archivos eliminados (estado='eliminado') se acumulan
-- indefinidamente en R2, generando costo y sin valor clínico.
--
-- SOLUCIÓN: Función SQL que identifica archivos con deleted_at > 30 días
-- y los purga invocando la Edge Function archivos-purge (reutilizada de F7-33).
--
-- REQUISITOS:
-- 1. Extensión pg_cron habilitada en Supabase Dashboard
-- 2. Extensión pg_net habilitada (para HTTP calls)
-- 3. Service role key insertada en tabla system_config (ver PASO 2 abajo)
--
-- SCHEDULE: Diario a las 3:00 AM (hora servidor)
-- ============================================================

-- ============================================================
-- 1. Tabla system_config para almacenar secrets del sistema
-- ============================================================
-- Solo service_role puede leer/escribir. Usuarios normales NO pueden
-- acceder ni siquiera a leer (RLS estricto).
-- ============================================================

CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE system_config IS 
  'F7-32: Tabla protegida para secrets del sistema (ej: service_role_key). '
  'Solo service_role puede leer/escribir (RLS estricto).';

ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Política: solo service_role puede hacer cualquier operación
-- auth.role() retorna el rol actual del cliente que ejecuta la query
CREATE POLICY system_config_service_role_only ON system_config
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON POLICY system_config_service_role_only ON system_config IS 
  'Solo service_role puede leer/escribir en system_config. '
  'Usuarios autenticados normales (anon, authenticated) NO pueden acceder.';

-- ============================================================
-- 2. Función: purgar_archivos_expirados()
-- ============================================================
-- Busca archivos en papelera con más de 30 días y los purga
-- invocando archivos-purge vía HTTP. SECURITY DEFINER para
-- poder leer system_config sin importar el rol del caller.
-- ============================================================

CREATE OR REPLACE FUNCTION purgar_archivos_expirados()
RETURNS void AS $$
DECLARE
  v_archivos RECORD;
  v_archivo_ids UUID[] := ARRAY[]::UUID[];
  v_count INTEGER := 0;
  -- F7-32: URL pública de Supabase (segura de hardcodear, no es secreta)
  v_supabase_url TEXT := 'https://nagduvivilmzupdpoayo.supabase.co';
  v_service_key TEXT;
  v_response_status INTEGER;
  v_response_body JSONB;
  v_result BIGINT;
BEGIN
  -- Leer service_role_key desde system_config (RLS bloquea a no-service_role)
  SELECT value INTO v_service_key 
  FROM system_config 
  WHERE key = 'service_role_key';
  
  IF v_service_key IS NULL OR v_service_key = '' THEN
    RAISE WARNING '[F7-32] Service role key no configurada en system_config. Abortando purga.'
      USING HINT = 'Ejecutar: INSERT INTO system_config (key, value) VALUES (''service_role_key'', ''<TU_KEY>'');';
    RETURN;
  END IF;

  -- Buscar archivos eliminados con más de 30 días
  FOR v_archivos IN
    SELECT id, clinica_id, nombre_archivo, deleted_at
    FROM archivos_clinicos
    WHERE estado = 'eliminado'
      AND deleted_at IS NOT NULL
      AND deleted_at < NOW() - INTERVAL '30 days'
    ORDER BY deleted_at ASC
    LIMIT 100  -- Procesar en lotes de 100 para evitar timeouts
  LOOP
    v_archivo_ids := array_append(v_archivo_ids, v_archivos.id);
    v_count := v_count + 1;
  END LOOP;

  -- Si no hay archivos para purgar, salir
  IF v_count = 0 THEN
    RAISE NOTICE '[F7-32] No hay archivos expirados para purgar.';
    RETURN;
  END IF;

  RAISE NOTICE '[F7-32] Encontrados % archivos para purgar.', v_count;

  -- Invocar Edge Function archivos-purge vía HTTP (pg_net)
  BEGIN
    -- pg_net es asíncrono por defecto. Para uso síncrono usamos:
    -- F7-32 FIX: Pasar el secreto como header X-Internal-Secret (no como Bearer token)
    SELECT status, content::jsonb
    INTO v_response_status, v_response_body
    FROM net.http_post(
      url := v_supabase_url || '/functions/v1/archivos-purge',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Internal-Secret', v_service_key
      ),
      body := jsonb_build_object(
        'archivo_ids', v_archivo_ids
      )
    );

    -- Verificar respuesta
    IF v_response_status = 200 THEN
      RAISE NOTICE '[F7-32] Purga exitosa: %', v_response_body;
      
      -- Registrar en audit_log
      INSERT INTO audit_log (
        clinica_id,
        user_id,
        table_name,
        record_id,
        action,
        new_data
      ) VALUES (
        (SELECT clinica_id FROM archivos_clinicos WHERE id = v_archivo_ids[1]),
        '00000000-0000-0000-0000-000000000000',  -- system user
        'cron',
        'auto-purge',
        'AUTO_PURGE_ARCHIVOS',
        jsonb_build_object(
          'evento', 'AUTO_PURGE_ARCHIVOS',
          'detalle', jsonb_build_object(
            'archivo_ids', v_archivo_ids,
            'count', v_count,
            'trigger', 'pg_cron',
            'timestamp', NOW()
          )
        )
      );
    ELSE
      RAISE WARNING '[F7-32] Error en purga: status=%, body=%', 
        v_response_status, v_response_body;
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING '[F7-32] Error invocando archivos-purge: %', SQLERRM;
  END;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION purgar_archivos_expirados IS 
  'F7-32: Purga automática de archivos en papelera con más de 30 días. '
  'Invoca archivos-purge vía HTTP. Requiere pg_cron + pg_net habilitados '
  'y service_role_key en system_config.';

-- ============================================================
-- 3. Schedule pg_cron (diario a las 3:00 AM)
-- ============================================================
-- pg_cron debe estar habilitado en Supabase Dashboard antes
-- de ejecutar este schedule.
--
-- Idempotente: si el job ya existe, lo elimina primero para
-- poder recrearlo (útil para re-aplicar la migración).
-- ============================================================

DO $$
DECLARE
  v_job_exists BOOLEAN;
BEGIN
  -- Verificar si pg_cron está habilitado
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE WARNING '[F7-32] pg_cron no está habilitado. Habilitar en Supabase Dashboard → Database → Extensions.';
    RETURN;
  END IF;

  -- Verificar si el job ya existe
  SELECT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'purge-archivos-expirados'
  ) INTO v_job_exists;

  -- Eliminar job previo si existe
  IF v_job_exists THEN
    PERFORM cron.unschedule('purge-archivos-expirados');
    RAISE NOTICE '[F7-32] Job previo eliminado.';
  END IF;

  -- Crear nuevo schedule: diario a las 3:00 AM
  PERFORM cron.schedule(
    'purge-archivos-expirados',
    '0 3 * * *',  -- cron: minuto 0, hora 3, todos los días
    'SELECT purgar_archivos_expirados()'
  );
  RAISE NOTICE '[F7-32] Schedule creado: diario a las 3:00 AM';
END $$;

-- ============================================================
-- VERIFICACIÓN (ejecutar manualmente después de aplicar migración)
-- ============================================================
-- 1. Ver schedules activos:
--    SELECT jobid, jobname, schedule, command FROM cron.job;
--
-- 2. Ver historial de ejecuciones:
--    SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
--
-- 3. Ejecutar manualmente (para testing):
--    SELECT purgar_archivos_expirados();
--
-- 4. Insertar internal_purge_secret (requerido antes del primer run):
--    INSERT INTO system_config (key, value)
--    VALUES ('internal_purge_secret', 'TU_SECRETO_COMPARTIDO_AQUI');
--    El mismo secreto debe configurarse como INTERNAL_PURGE_SECRET
--    en las env vars de archivos-purge (Supabase Dashboard → Edge Functions).
