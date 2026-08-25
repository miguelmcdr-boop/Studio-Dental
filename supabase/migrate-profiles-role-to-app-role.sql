-- F6-B7: Migrar profiles.role de TEXT a app_role (VERSIÓN CORREGIDA)
-- 
-- ⚠️ EJECUTAR EN: STAGING (bjuqqtkiqnfyejitmowc) y ORIGINAL (nagduvivilmzupdpoayo)
-- 📍 DÓNDE: https://supabase.com/dashboard/project/[ID_PROYECTO]/sql
-- 🎯 PROPÓSITO: Cambiar el tipo de profiles.role de text a app_role (ENUM)
-- ⏱️ TIEMPO ESTIMADO: 5 segundos
-- ⚠️ IMPORTANTE: 
--   - Ejecutar DESPUÉS de schema-rbac.sql (que crea el ENUM app_role)
--   - Idempotente: seguro re-ejecutar (verifica estado antes de alterar)
--   - Aborta si hay valores inválidos en profiles.role
--   - CORRECCIÓN: Elimina DEFAULT antes del ALTER para evitar error 42804

-- ============================================================
-- PASO 1: Verificar que no haya valores inválidos (abortar si los hay)
-- ============================================================
DO $$
DECLARE
  invalid_count INTEGER;
  invalid_values TEXT;
BEGIN
  SELECT COUNT(*), string_agg(DISTINCT role, ', ')
  INTO invalid_count, invalid_values
  FROM public.profiles
  WHERE role NOT IN ('admin', 'dentista', 'asistente', 'recepcion');
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'ABORT: Hay % valores inválidos en profiles.role: %', invalid_count, invalid_values;
  END IF;
  
  RAISE NOTICE '✅ No hay valores inválidos, seguro para continuar';
END $$;

-- ============================================================
-- PASO 2: Verificar que el ENUM app_role existe (abortar si no)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    RAISE EXCEPTION 'ABORT: El ENUM app_role no existe. Ejecutar schema-rbac.sql primero.';
  END IF;
  
  RAISE NOTICE '✅ ENUM app_role existe';
END $$;

-- ============================================================
-- PASO 3: Eliminar CHECK constraint si existe
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_role_check'
      AND contype = 'c'
  ) THEN
    RAISE NOTICE 'Eliminando CHECK constraint profiles_role_check...';
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
    RAISE NOTICE '✅ CHECK constraint eliminado';
  ELSE
    RAISE NOTICE 'CHECK constraint profiles_role_check no existe, nada que eliminar';
  END IF;
END $$;

-- ============================================================
-- PASO 4: Alterar columna de TEXT a app_role (si aún es text)
-- CORRECCIÓN: Eliminar DEFAULT antes del ALTER
-- ============================================================
DO $$
DECLARE
  current_type TEXT;
BEGIN
  SELECT 
    CASE WHEN data_type = 'USER-DEFINED' THEN udt_name ELSE data_type END
  INTO current_type
  FROM information_schema.columns
  WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role';
  
  IF current_type = 'app_role' THEN
    RAISE NOTICE 'La columna ya es tipo app_role, nada que hacer';
  ELSIF current_type = 'text' THEN
    RAISE NOTICE 'Alterando columna profiles.role de text a app_role...';
    
    -- Paso 4a: Eliminar DEFAULT actual (tipo text)
    RAISE NOTICE '  4a. Eliminando DEFAULT actual...';
    ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
    
    -- Paso 4b: Alterar el tipo de la columna
    RAISE NOTICE '  4b. Alterando tipo de columna...';
    ALTER TABLE public.profiles 
      ALTER COLUMN role TYPE app_role 
      USING role::app_role;
    
    -- Paso 4c: Agregar nuevo DEFAULT de tipo app_role
    RAISE NOTICE '  4c. Agregando nuevo DEFAULT de tipo app_role...';
    ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'recepcion'::app_role;
    
    RAISE NOTICE '✅ Columna alterada exitosamente';
  ELSE
    RAISE EXCEPTION 'ABORT: Tipo inesperado: %. Esperado text o app_role.', current_type;
  END IF;
END $$;

-- ============================================================
-- PASO 5: Verificación final
-- ============================================================
SELECT 
  'Verificación: tipo de profiles.role' AS check_name,
  CASE 
    WHEN data_type = 'USER-DEFINED' AND udt_name = 'app_role' 
    THEN '✅ app_role (migración exitosa)'
    ELSE '❌ ' || data_type || ' (migración falló)'
  END AS status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'role';

SELECT 
  'Verificación: CHECK constraints restantes' AS check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Ninguno (correcto)'
    ELSE '⚠️ ' || COUNT(*)::text || ' constraints restantes'
  END AS status
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND contype = 'c';

SELECT 
  'Verificación: DEFAULT actual' AS check_name,
  COALESCE(column_default, 'Sin DEFAULT') AS default_value
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'role';

SELECT 
  'Verificación: datos actuales' AS check_name,
  role,
  COUNT(*) AS cantidad
FROM public.profiles
GROUP BY role
ORDER BY role;
