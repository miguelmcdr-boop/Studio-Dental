-- F6-B7: Diagnóstico unificado de políticas RLS en tablas clínicas
-- 
-- ⚠️ EJECUTAR EN: STAGING (bjuqqtkiqnfyejitmowc) y ORIGINAL (nagduvivilmzupdpoayo)
-- 🎯 PROPÓSITO: Ver en UNA sola tabla qué tablas clínicas existen y cuáles tienen políticas RLS
-- 📋 NOTA: Usa UNION ALL para que el SQL Editor muestre todo en una tabla

SELECT 
  t.table_name AS tabla,
  '✅ Existe' AS existe,
  COALESCE(p.num_politicas, 0)::text AS num_politicas,
  CASE 
    WHEN p.num_politicas IS NULL OR p.num_politicas = 0 THEN '❌ Sin políticas'
    ELSE '✅ Con políticas'
  END AS status_politicas
FROM information_schema.tables t
LEFT JOIN (
  SELECT tablename, COUNT(*) AS num_politicas
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('pacientes','citas','evoluciones_clinicas','recetas','odontogramas','periodontogramas','certificados')
  GROUP BY tablename
) p ON t.table_name = p.tablename
WHERE t.table_schema = 'public'
  AND t.table_name IN ('pacientes','citas','evoluciones_clinicas','recetas','odontogramas','periodontogramas','certificados')
ORDER BY t.table_name;
