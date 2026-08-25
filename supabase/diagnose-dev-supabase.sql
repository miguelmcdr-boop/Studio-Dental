-- F6-Ib: Diagnóstico del estado actual del proyecto original de Supabase
-- 
-- ⚠️ EJECUTAR EN: PROYECTO ORIGINAL (nagduvivilmzupdpoayo) — NO EN STAGING NI PRODUCCIÓN
-- 📍 DÓNDE: https://supabase.com/dashboard/project/nagduvivilmzupdpoayo/sql
-- 🎯 PROPÓSITO: Determinar qué schemas están ya aplicados para saber qué falta
-- ⏱️ TIEMPO ESTIMADO: 10 segundos
-- ✅ RESULTADO ESPERADO: Lista de qué está y qué falta

-- ============================================================
-- SECCIÓN 1: TABLAS CLAVE
-- ============================================================

SELECT 
  'Tablas base (schema.sql F4-02a)' AS check_group,
  table_name,
  '✅ Existe' AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('pacientes', 'citas', 'presupuestos', 'pagos', 'movimientos_financieros')
ORDER BY table_name;

SELECT 
  'Tablas clínicas (schema-clinical-tables.sql F4-02c-1)' AS check_group,
  table_name,
  '✅ Existe' AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('evoluciones_clinicas', 'recetas', 'odontogramas', 'periodontogramas', 'clinicas')
ORDER BY table_name;

SELECT 
  'Tablas multi-clínica (schema-multiclinica-base.sql F6-C-a)' AS check_group,
  table_name,
  '✅ Existe' AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('clinicas', 'miembros_clinica')
ORDER BY table_name;

SELECT 
  'Tabla audit_log (schema-audit-log.sql F5-04)' AS check_group,
  table_name,
  '✅ Existe' AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('audit_log');

SELECT 
  'Tablas vademécum (schema-vademecum.sql F6-A)' AS check_group,
  table_name,
  '✅ Existe' AS status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'vademecum%'
ORDER BY table_name;

SELECT 
  'Tablas soft delete (schema-soft-delete.sql F6-Fa)' AS check_group,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pacientes' AND column_name = 'deleted_at'
  ) THEN 'pacientes.deleted_at ✅' ELSE 'pacientes.deleted_at ❌' END AS status;

-- ============================================================
-- SECCIÓN 2: TIPOS Y FUNCIONES CLAVE
-- ============================================================

SELECT 
  'Tipo app_role (schema-rbac.sql F6-B1)' AS check_group,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'app_role'
  ) THEN '✅ Existe' ELSE '❌ Falta' END AS status;

SELECT 
  'Función clinica_actual() (schema-multiclinica-base.sql F6-C-a)' AS check_group,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'clinica_actual'
  ) THEN '✅ Existe' ELSE '❌ Falta' END AS status;

SELECT 
  'Función tiene_rol_en_clinica() (schema-multiclinica-helpers-rol.sql)' AS check_group,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'tiene_rol_en_clinica'
  ) THEN '✅ Existe' ELSE '❌ Falta' END AS status;

SELECT 
  'Función es_admin_de_clinica_actual() (schema-multiclinica-helpers-rol.sql)' AS check_group,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'es_admin_de_clinica_actual'
  ) THEN '✅ Existe' ELSE '❌ Falta' END AS status;

-- ============================================================
-- SECCIÓN 3: POLÍTICAS RLS CLAVE
-- ============================================================

SELECT 
  'Políticas RLS en pacientes' AS check_group,
  policyname,
  '✅' AS status
FROM pg_policies 
WHERE tablename = 'pacientes' AND schemaname = 'public'
ORDER BY policyname;

SELECT 
  'Políticas RLS en audit_log' AS check_group,
  policyname,
  '✅' AS status
FROM pg_policies 
WHERE tablename = 'audit_log' AND schemaname = 'public'
ORDER BY policyname;

-- ============================================================
-- SECCIÓN 4: DATOS EXISTENTES (para saber si migraciones se ejecutaron)
-- ============================================================

SELECT 
  'Datos en tabla clinicas' AS check_group,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clinicas') 
    THEN (SELECT COUNT(*)::text || ' clínicas' FROM clinicas)
    ELSE 'Tabla no existe' END AS status;

SELECT 
  'Datos en tabla miembros_clinica' AS check_group,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'miembros_clinica') 
    THEN (SELECT COUNT(*)::text || ' membresías' FROM miembros_clinica)
    ELSE 'Tabla no existe' END AS status;

SELECT 
  'Datos en audit_log' AS check_group,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') 
    THEN (SELECT COUNT(*)::text || ' registros' FROM audit_log)
    ELSE 'Tabla no existe' END AS status;

SELECT 
  'Datos en tablas vademécum' AS check_group,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vademecum') 
    THEN (SELECT COUNT(*)::text || ' registros' FROM vademecum)
    ELSE 'Tabla no existe' END AS status;

-- ============================================================
-- SECCIÓN 5: USUARIOS (para verificar migración de roles)
-- ============================================================

SELECT 
  'Total de usuarios en auth.users' AS check_group,
  COUNT(*)::text || ' usuarios' AS status
FROM auth.users;

SELECT 
  'Usuarios con rol en app_metadata (F6-B migrado)' AS check_group,
  COUNT(*)::text || ' usuarios' AS status
FROM auth.users
WHERE raw_app_meta_data->>'role' IS NOT NULL;

SELECT 
  'Usuarios sin rol en app_metadata (F6-B NO migrado)' AS check_group,
  COUNT(*)::text || ' usuarios' AS status
FROM auth.users
WHERE raw_app_meta_data->>'role' IS NULL;

-- ============================================================
-- SECCIÓN 6: COLUMNAS CLAVE (para detectar estado multi-clínica)
-- ============================================================

SELECT 
  'Columna clinica_id en pacientes' AS check_group,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pacientes' AND column_name = 'clinica_id'
  ) THEN '✅ Existe (F6-C-c aplicado)' ELSE '❌ Falta (F6-C-c NO aplicado)' END AS status;

SELECT 
  'Columna clinica_id en citas' AS check_group,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'citas' AND column_name = 'clinica_id'
  ) THEN '✅ Existe (F6-C-c aplicado)' ELSE '❌ Falta (F6-C-c NO aplicado)' END AS status;

SELECT 
  'Columna clinica_id en evoluciones_clinicas' AS check_group,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'evoluciones_clinicas' AND column_name = 'clinica_id'
  ) THEN '✅ Existe (F6-C-c aplicado)' ELSE '❌ Falta (F6-C-c NO aplicado)' END AS status;
