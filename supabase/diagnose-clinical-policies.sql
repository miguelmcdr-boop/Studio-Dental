-- F6-B7: Diagnóstico de políticas RLS en tablas clínicas
-- 
-- ⚠️ EJECUTAR EN: STAGING (bjuqqtkiqnfyejitmowc) y ORIGINAL (nagduvivilmzupdpoayo)
-- 🎯 PROPÓSITO: Ver qué tablas clínicas tienen políticas RLS y cuáles no

-- Verificar qué tablas clínicas existen
SELECT 
  'Tablas clínicas que existen' AS check_name,
  table_name,
  '✅ Existe' AS status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('pacientes','citas','evoluciones_clinicas','recetas','odontogramas','periodontogramas','certificados','adjuntos_clinicos')
ORDER BY table_name;

-- Verificar qué tablas clínicas tienen políticas RLS
SELECT 
  'Tablas clínicas con políticas RLS' AS check_name,
  tablename,
  COUNT(*) AS num_politicas
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('pacientes','citas','evoluciones_clinicas','recetas','odontogramas','periodontogramas','certificados','adjuntos_clinicos')
GROUP BY tablename
ORDER BY tablename;

-- Verificar qué tablas clínicas NO tienen políticas RLS
SELECT 
  'Tablas clínicas SIN políticas RLS' AS check_name,
  t.table_name,
  '❌ Sin políticas' AS status
FROM information_schema.tables t
LEFT JOIN pg_policies p ON t.table_name = p.tablename AND p.schemaname = 'public'
WHERE t.table_schema = 'public'
  AND t.table_name IN ('pacientes','citas','evoluciones_clinicas','recetas','odontogramas','periodontogramas','certificados','adjuntos_clinicos')
  AND p.tablename IS NULL
ORDER BY t.table_name;
