-- F6-M: Verificar accesibilidad de tabla audit_log
-- 
-- ⚠️ EJECUTAR EN: STAGING (bjuqqtkiqnfyejitmowc)
-- 📍 DÓNDE: https://supabase.com/dashboard/project/bjuqqtkiqnfyejitmowc/sql
-- 🎯 PROPÓSITO: Verificar que audit_log existe y tiene políticas RLS correctas
-- ⏱️ TIEMPO ESTIMADO: 10 segundos
-- ✅ RESULTADO ESPERADO: 5 filas con status OK

-- 1. Verificar que la tabla existe
SELECT 
  'Tabla audit_log existe' AS check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'audit_log'
  ) THEN '✅ OK' ELSE '❌ FALTA' END AS status;

-- 2. Verificar que RLS está habilitado
SELECT 
  'RLS habilitado en audit_log' AS check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'audit_log' AND rowsecurity = true
  ) THEN '✅ OK' ELSE '❌ DESHABILITADO' END AS status;

-- 3. Verificar políticas RLS existentes
SELECT 
  'Políticas RLS de audit_log' AS check_name,
  COUNT(*)::text || ' políticas encontradas' AS status
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'audit_log';

-- 4. Verificar índices
SELECT 
  'Índices de audit_log' AS check_name,
  COUNT(*)::text || ' índices encontrados' AS status
FROM pg_indexes 
WHERE schemaname = 'public' AND tablename = 'audit_log';

-- 5. Verificar que hay registros en audit_log (si aplica)
SELECT 
  'Registros en audit_log' AS check_name,
  COUNT(*)::text || ' registros' AS status
FROM public.audit_log;

-- 6. Verificar políticas específicas
SELECT 
  'Política SELECT: ' || policyname AS check_name,
  CASE WHEN qual IS NOT NULL THEN '✅ Con condición' ELSE '⚠️ Sin condición' END AS status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'audit_log' 
  AND cmd = 'SELECT';

SELECT 
  'Política INSERT: ' || policyname AS check_name,
  CASE WHEN with_check IS NOT NULL THEN '✅ Con condición' ELSE '⚠️ Sin condición' END AS status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'audit_log' 
  AND cmd = 'INSERT';
