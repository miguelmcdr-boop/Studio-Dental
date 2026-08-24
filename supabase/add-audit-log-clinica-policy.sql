-- F6-M: Agregar política para que usuarios de la clínica vean logs de su clínica
-- 
-- ⚠️ EJECUTAR EN: STAGING (bjuqqtkiqnfyejitmowc)
-- 📍 DÓNDE: https://supabase.com/dashboard/project/bjuqqtkiqnfyejitmowc/sql
-- 🎯 PROPÓSITO: Permitir que usuarios con rol en la clínica vean logs de esa clínica
-- ⏱️ TIEMPO ESTIMADO: 5 segundos
-- ⚠️ IMPORTANTE: Esta política NO reemplaza las existentes, solo agrega una nueva

-- 1. Verificar que la política no existe ya
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'audit_log' 
      AND policyname = 'audit_log_select_clinica'
  ) THEN
    RAISE NOTICE 'La política audit_log_select_clinica ya existe, no se creará';
  ELSE
    RAISE NOTICE 'Creando política audit_log_select_clinica...';
  END IF;
END $$;

-- 2. Crear la política (solo si no existe)
DROP POLICY IF EXISTS "audit_log_select_clinica" ON public.audit_log;
CREATE POLICY "audit_log_select_clinica"
  ON public.audit_log
  FOR SELECT
  USING (
    clinica_id = clinica_actual() 
    AND tiene_rol_en_clinica(ARRAY['admin'::app_role, 'dentista'::app_role, 'asistente'::app_role, 'recepcion'::app_role])
  );

-- 3. Verificar que se creó
SELECT 
  'Política creada' AS check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'audit_log' 
      AND policyname = 'audit_log_select_clinica'
  ) THEN '✅ audit_log_select_clinica' ELSE '❌ No se creó' END AS status;

-- 4. Mostrar todas las políticas de audit_log
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN policyname = 'audit_log_select_admin' THEN 'Solo admins ven logs de su clínica'
    WHEN policyname = 'audit_log_select_own' THEN 'Usuarios ven sus propios logs'
    WHEN policyname = 'audit_log_select_clinica' THEN 'Usuarios ven logs de su clínica (NUEVA)'
    WHEN policyname = 'audit_log_insert_clinica' THEN 'Usuarios registran sus acciones'
    ELSE 'Otra'
  END AS description
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'audit_log'
ORDER BY policyname;
