-- F6-B7: Diagnóstico del tipo de profiles.role en el proyecto actual
-- 
-- ⚠️ EJECUTAR EN: STAGING (bjuqqtkiqnfyejitmowc) y ORIGINAL (nagduvivilmzupdpoayo)
-- 📍 DÓNDE: https://supabase.com/dashboard/project/[ID_PROYECTO]/sql
-- 🎯 PROPÓSITO: Verificar el tipo actual de profiles.role y datos existentes
-- ⏱️ TIEMPO ESTIMADO: 5 segundos

-- ============================================================
-- 1. Tipo actual de la columna profiles.role
-- ============================================================
SELECT 
  'Tipo de profiles.role' AS check_name,
  data_type,
  CASE 
    WHEN data_type = 'USER-DEFINED' THEN udt_name
    ELSE data_type
  END AS tipo_especifico,
  character_maximum_length AS max_length
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'role';

-- ============================================================
-- 2. CHECK constraints en profiles.role
-- ============================================================
SELECT 
  'CHECK constraints en profiles' AS check_name,
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND contype = 'c';

-- ============================================================
-- 3. Valores actuales de profiles.role (verificar validez)
-- ============================================================
SELECT 
  'Valores actuales de profiles.role' AS check_name,
  role,
  COUNT(*) AS cantidad
FROM public.profiles
GROUP BY role
ORDER BY role;

-- ============================================================
-- 4. Verificar si hay valores inválidos (fuera del ENUM)
-- ============================================================
SELECT 
  'Valores inválidos detectados' AS check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Ninguno (seguro para ALTER)'
    ELSE '❌ ' || COUNT(*)::text || ' valores inválidos: ' || string_agg(DISTINCT role, ', ')
  END AS status
FROM public.profiles
WHERE role NOT IN ('admin', 'dentista', 'asistente', 'recepcion');

-- ============================================================
-- 5. Total de usuarios en profiles
-- ============================================================
SELECT 
  'Total de perfiles' AS check_name,
  COUNT(*)::text || ' usuarios' AS status
FROM public.profiles;

-- ============================================================
-- 6. Verificar si el ENUM app_role existe
-- ============================================================
SELECT 
  'ENUM app_role existe' AS check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') 
    THEN '✅ Sí'
    ELSE '❌ No (necesario para ALTER)'
  END AS status;

-- ============================================================
-- 7. Verificar triggers en profiles
-- ============================================================
SELECT 
  'Triggers en profiles' AS check_name,
  tgname AS trigger_name,
  CASE tgtype & 2 WHEN 2 THEN 'BEFORE' ELSE 'AFTER' END AS timing,
  CASE tgtype & 28
    WHEN 4 THEN 'INSERT'
    WHEN 8 THEN 'DELETE'
    WHEN 16 THEN 'UPDATE'
    ELSE 'MULTIPLE'
  END AS event
FROM pg_trigger
WHERE tgrelid = 'public.profiles'::regclass
  AND NOT tgisinternal
ORDER BY tgname;
