-- F6-Ib: Alinear proyecto original de Supabase con schemas versionados
-- 
-- ⚠️ EJECUTAR EN: PROYECTO ORIGINAL (nagduvivilmzupdpoayo) — NO EN STAGING NI PRODUCCIÓN
-- 📍 DÓNDE: https://supabase.com/dashboard/project/nagduvivilmzupdpoayo/sql
-- 🎯 PROPÓSITO: Agregar políticas de audit_log faltantes y verificar tablas vademécum
-- ⏱️ TIEMPO ESTIMADO: 5 segundos
-- ✅ RESULTADO ESPERADO: 4 políticas en audit_log + reporte de tablas vademécum

-- ============================================================
-- PARTE A: Verificar y agregar columna clinica_id a audit_log si falta
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_log' AND column_name = 'clinica_id'
  ) THEN
    RAISE NOTICE 'Agregando columna clinica_id a audit_log...';
    ALTER TABLE public.audit_log ADD COLUMN clinica_id uuid;
  ELSE
    RAISE NOTICE 'La columna clinica_id ya existe en audit_log';
  END IF;
END $$;

-- ============================================================
-- PARTE B: Agregar política audit_log_insert_clinica si falta
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'audit_log' 
      AND policyname = 'audit_log_insert_clinica'
  ) THEN
    RAISE NOTICE 'Creando política audit_log_insert_clinica...';
    CREATE POLICY "audit_log_insert_clinica"
      ON public.audit_log
      FOR INSERT
      WITH CHECK (
        user_id = auth.uid() 
        AND tiene_rol_en_clinica(ARRAY['admin'::app_role, 'dentista'::app_role, 'asistente'::app_role, 'recepcion'::app_role])
      );
  ELSE
    RAISE NOTICE 'La política audit_log_insert_clinica ya existe, no se creará';
  END IF;
END $$;

-- ============================================================
-- PARTE C: Agregar política audit_log_select_clinica si falta (F6-M)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'audit_log' 
      AND policyname = 'audit_log_select_clinica'
  ) THEN
    RAISE NOTICE 'Creando política audit_log_select_clinica...';
    CREATE POLICY "audit_log_select_clinica"
      ON public.audit_log
      FOR SELECT
      USING (
        clinica_id = clinica_actual() 
        AND tiene_rol_en_clinica(ARRAY['admin'::app_role, 'dentista'::app_role, 'asistente'::app_role, 'recepcion'::app_role])
      );
  ELSE
    RAISE NOTICE 'La política audit_log_select_clinica ya existe, no se creará';
  END IF;
END $$;

-- ============================================================
-- PARTE D: Verificar tablas vademécum (reporte, no creación automática)
-- ============================================================

SELECT 
  'Tablas vademécum esperadas (F6-A: 8 tablas)' AS check_group,
  expected.table_name,
  CASE WHEN t.table_name IS NOT NULL THEN '✅ Existe' ELSE '❌ Falta' END AS status
FROM (
  SELECT unnest(ARRAY[
    'vademecum',
    'vademecum_antirresortivos',
    'vademecum_urgencia',
    'vademecum_contraindicaciones',
    'vademecum_embarazo',
    'vademecum_interacciones',
    'vademecum_dosis',
    'vademecum_presentaciones'
  ]) AS table_name
) expected
LEFT JOIN information_schema.tables t 
  ON t.table_name = expected.table_name 
  AND t.table_schema = 'public'
ORDER BY expected.table_name;

-- ============================================================
-- PARTE E: Verificación final
-- ============================================================

SELECT 
  'Políticas de audit_log (esperadas: 4)' AS check_group,
  COUNT(*)::text || ' políticas' AS status
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'audit_log';

SELECT 
  'Lista de políticas de audit_log' AS check_group,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'audit_log'
ORDER BY policyname;
