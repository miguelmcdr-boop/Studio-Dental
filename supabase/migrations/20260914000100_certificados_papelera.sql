-- ============================================================
-- M3: Papelera de certificados con retención de 730 días
-- ============================================================
--
-- PROBLEMA: Los certificados médicos no deben eliminarse de forma
-- irreversible (riesgo legal y de auditoría). Se necesita papelera
-- con retención antes del borrado definitivo.
--
-- SOLUCIÓN:
-- - Soft delete: columnas eliminado_at, eliminado_por, eliminado_motivo
-- - Retención 730 días (consistente con pagos)
-- - Job pg_cron diario que invoca archivos-purge (F7-32) para borrar
--   también el PDF de R2 y luego elimina la fila.
--
-- REQUISITOS:
-- 1. pg_cron habilitado (ya está por F7-32)
-- 2. pg_net habilitado (ya está por F7-32)
-- 3. internal_purge_secret en system_config (ya está por F7-32)
--
-- SCHEDULE: Diario a las 3:00 AM (consistente con F7-32)
-- ============================================================

-- ============================================================
-- 1. Columnas de soft-delete en certificados
-- ============================================================

ALTER TABLE certificados
  ADD COLUMN IF NOT EXISTS eliminado_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS eliminado_por UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS eliminado_motivo TEXT;

COMMENT ON COLUMN certificados.eliminado_at IS
  'M3: Marca de soft-delete. NULL = activo, con fecha = en papelera.';

COMMENT ON COLUMN certificados.eliminado_por IS
  'M3: Usuario que movió el certificado a la papelera.';

COMMENT ON COLUMN certificados.eliminado_motivo IS
  'M3: Motivo de la eliminación (opcional, para auditoría).';

-- ============================================================
-- 2. Índices para papelera
-- ============================================================

-- Búsqueda eficiente de certificados en papelera
CREATE INDEX IF NOT EXISTS certificados_eliminado_at_idx
  ON certificados(eliminado_at)
  WHERE eliminado_at IS NOT NULL;

COMMENT ON INDEX certificados_eliminado_at_idx IS
  'M3: acelera listados de papelera y el job de purga diaria (WHERE eliminado_at IS NOT NULL).';

-- ============================================================
-- 3. Política RLS: UPDATE requiere admin para mover a papelera
-- ============================================================

-- Restaurar la política original de UPDATE (creador o admin pueden actualizar)
-- La restricción de "solo admin puede cambiar eliminado_at" se valida
-- mediante el trigger validar_eliminado_at_certificados (más abajo).
DROP POLICY IF EXISTS "certificados_update_propio" ON certificados;

CREATE POLICY "certificados_update_propio" ON certificados
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM miembros_clinica
      WHERE user_id = auth.uid() AND clinica_id = certificados.clinica_id AND rol = 'admin'
    )
  );

COMMENT ON POLICY "certificados_update_propio" ON certificados IS
  'M3: creador o admin pueden actualizar. La restricción de papelera '
  'se valida en el trigger validar_eliminado_at_certificados.';


-- ============================================================
-- 4. Trigger: validar_eliminado_at_certificados()
-- ============================================================
-- Valida que solo admin puede cambiar eliminado_at.
-- Esto complementa la política RLS simple (que solo valida
-- visibilidad, no quién puede hacer soft-delete).
-- ============================================================

CREATE OR REPLACE FUNCTION validar_eliminado_at_certificados()
RETURNS TRIGGER AS $$
BEGIN
  -- Si eliminado_at cambió (de NULL a valor o viceversa)
  IF OLD.eliminado_at IS DISTINCT FROM NEW.eliminado_at THEN
    -- Verificar que el usuario actual es admin de la clínica
    IF NOT EXISTS (
      SELECT 1 FROM miembros_clinica
      WHERE user_id = auth.uid()
        AND clinica_id = NEW.clinica_id
        AND rol = 'admin'
    ) THEN
      RAISE EXCEPTION 'Solo los administradores pueden mover certificados a la papelera o restaurarlos'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validar_eliminado_at_certificados IS
  'M3: valida que solo admin puede cambiar eliminado_at (mover a papelera o restaurar).';

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_validar_eliminado_at_certificados ON certificados;
CREATE TRIGGER trigger_validar_eliminado_at_certificados
  BEFORE UPDATE ON certificados
  FOR EACH ROW
  EXECUTE FUNCTION validar_eliminado_at_certificados();

-- ============================================================
-- 5. Función: purgar_certificados_expirados()
-- ============================================================
-- Busca certificados en papelera con más de 730 días, extrae
-- r2ArchivoId del JSONB y los pasa a archivos-purge (F7-32) para
-- borrar el PDF de R2, luego elimina las filas.
-- SECURITY DEFINER para leer system_config sin importar el caller.
-- ============================================================

CREATE OR REPLACE FUNCTION purgar_certificados_expirados()
RETURNS void AS $$
DECLARE
  v_cert RECORD;
  v_archivo_ids UUID[] := ARRAY[]::UUID[];
  v_count INTEGER := 0;
  v_archivo_id UUID;
  v_supabase_url TEXT := 'https://nagduvivilmzupdpoayo.supabase.co';
  v_service_key TEXT;
BEGIN
  -- Leer internal_purge_secret (compartida con F7-32)
  SELECT value INTO v_service_key
  FROM system_config
  WHERE key = 'internal_purge_secret';

  IF v_service_key IS NULL OR v_service_key = '' THEN
    RAISE WARNING '[M3] internal_purge_secret no configurada en system_config. Abortando purga de certificados.'
      USING HINT = 'Ejecutar: INSERT INTO system_config (key, value) VALUES (''internal_purge_secret'', ''<SECRETO>'');';
    RETURN;
  END IF;

  -- Buscar certificados vencidos (más de 730 días en papelera)
  FOR v_cert IN
    SELECT id, clinica_id, datos, eliminado_at
    FROM certificados
    WHERE eliminado_at IS NOT NULL
      AND eliminado_at < NOW() - INTERVAL '730 days'
    ORDER BY eliminado_at ASC
    LIMIT 100  -- Lotes para evitar timeouts
  LOOP
    -- Extraer r2ArchivoId del JSONB (puede ser NULL si nunca se respaldó)
    v_archivo_id := (v_cert.datos->>'r2ArchivoId')::UUID;
    IF v_archivo_id IS NOT NULL THEN
      v_archivo_ids := array_append(v_archivo_ids, v_archivo_id);
    END IF;
    v_count := v_count + 1;
  END LOOP;

  IF v_count = 0 THEN
    RAISE NOTICE '[M3] No hay certificados vencidos para purgar.';
    RETURN;
  END IF;

  RAISE NOTICE '[M3] Encontrados % certificados vencidos para purgar.', v_count;

  -- Invocar archivos-purge vía HTTP si hay archivos de R2 para borrar
  IF array_length(v_archivo_ids, 1) > 0 THEN
    BEGIN
      PERFORM net.http_post(
        url := v_supabase_url || '/functions/v1/archivos-purge',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-Internal-Secret', v_service_key
        ),
        body := jsonb_build_object(
          'archivo_ids', v_archivo_ids
        )
      );
      RAISE NOTICE '[M3] Request encolada para purgar % archivo(s) de R2.', array_length(v_archivo_ids, 1);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '[M3] Error encolando request de R2: %. Los archivos quedarán huérfanos, pero las filas se eliminarán igual.', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '[M3] No hay archivos R2 asociados a los certificados vencidos.';
  END IF;

  -- Eliminar las filas de certificados (independiente de si R2 falló o no)
  DELETE FROM certificados
  WHERE eliminado_at IS NOT NULL
    AND eliminado_at < NOW() - INTERVAL '730 days'
    AND id IN (SELECT id FROM (
      SELECT id FROM certificados
      WHERE eliminado_at IS NOT NULL
        AND eliminado_at < NOW() - INTERVAL '730 days'
      ORDER BY eliminado_at ASC
      LIMIT 100
    ) AS subq);

  RAISE NOTICE '[M3] Eliminadas % filas de certificados vencidos.', v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION purgar_certificados_expirados IS
  'M3: Purga automática de certificados en papelera con más de 730 días. '
  'Invoca archivos-purge (F7-32) vía HTTP para borrar el PDF de R2, '
  'luego elimina las filas. Requiere pg_cron + pg_net + internal_purge_secret.';

-- ============================================================
-- 6. Schedule pg_cron (diario a las 3:00 AM, mismo horario que F7-32)
-- ============================================================

DO $$
DECLARE
  v_job_exists BOOLEAN;
BEGIN
  -- Verificar si pg_cron está habilitado
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE WARNING '[M3] pg_cron no está habilitado. Habilitar en Supabase Dashboard → Database → Extensions.';
    RETURN;
  END IF;

  -- Verificar si el job ya existe
  SELECT EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'purge-certificados-expirados'
  ) INTO v_job_exists;

  -- Eliminar job previo si existe (idempotente)
  IF v_job_exists THEN
    PERFORM cron.unschedule('purge-certificados-expirados');
    RAISE NOTICE '[M3] Job previo eliminado.';
  END IF;

  -- Crear nuevo schedule: diario a las 3:00 AM
  PERFORM cron.schedule(
    'purge-certificados-expirados',
    '0 3 * * *',  -- minuto 0, hora 3, todos los días
    'SELECT purgar_certificados_expirados()'
  );
  RAISE NOTICE '[M3] Schedule creado: purge-certificados-expirados diario a las 3:00 AM';
END $$;

-- ============================================================
-- VERIFICACIÓN (ejecutar manualmente después de aplicar)
-- ============================================================
-- 1. Ver schedules activos:
--    SELECT jobid, jobname, schedule, command FROM cron.job;
--
-- 2. Ejecutar manualmente (para testing):
--    SELECT purgar_certificados_expirados();
--
-- 3. Ver certificados en papelera:
--    SELECT id, fecha_emision, tipo, eliminado_at, eliminado_motivo
--    FROM certificados
--    WHERE eliminado_at IS NOT NULL
--    ORDER BY eliminado_at DESC;
--
-- 4. Ver historial de ejecuciones:
--    SELECT * FROM cron.job_run_details
--    WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'purge-certificados-expirados')
--    ORDER BY start_time DESC LIMIT 10;
--
-- 5. Rollback (si es necesario):
--    PERFORM cron.unschedule('purge-certificados-expirados');
--    DROP FUNCTION purgar_certificados_expirados();
--    ALTER TABLE certificados DROP COLUMN eliminado_at;
--    ALTER TABLE certificados DROP COLUMN eliminado_por;
--    ALTER TABLE certificados DROP COLUMN eliminado_motivo;
--    DROP INDEX IF EXISTS certificados_eliminado_at_idx;
