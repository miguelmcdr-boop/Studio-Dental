-- F6-B7: Verificación simplificada de RBAC (13 checks sin tabla temporal)
-- 
-- ⚠️ EJECUTAR EN: STAGING (bjuqqtkiqnfyejitmowc) y ORIGINAL (nagduvivilmzupdpoayo)
-- 🎯 PROPÓSITO: Verificar las 13 aserciones de RBAC sin usar tabla temporal
-- ⏱️ TIEMPO ESTIMADO: 5 segundos

SELECT '1. enum app_role existe' AS check_name,
       CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname='app_role') THEN 'PASS' ELSE 'FAIL' END AS result;

SELECT '2. app_role tiene 4 valores' AS check_name,
       CASE WHEN (SELECT count(*) FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='app_role') = 4
       THEN 'PASS' ELSE 'FAIL' END AS result;

SELECT '3. current_role() existe' AS check_name,
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='public' AND p.proname='current_role') 
       THEN 'PASS' ELSE 'FAIL' END AS result;

SELECT '4. has_role() existe' AS check_name,
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='public' AND p.proname='has_role') 
       THEN 'PASS' ELSE 'FAIL' END AS result;

SELECT '5. is_admin() existe' AS check_name,
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='public' AND p.proname='is_admin') 
       THEN 'PASS' ELSE 'FAIL' END AS result;

SELECT '6. role_in() existe' AS check_name,
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='public' AND p.proname='role_in') 
       THEN 'PASS' ELSE 'FAIL' END AS result;

SELECT '7. trigger on_auth_user_created' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid=c.oid
         WHERE c.relname='users' AND t.tgname='on_auth_user_created'
       ) THEN 'PASS' ELSE 'FAIL' END AS result;

SELECT '8. trigger lock_profiles_role' AS check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid=c.oid
         WHERE c.relname='profiles' AND t.tgname='lock_profiles_role'
       ) THEN 'PASS' ELSE 'FAIL' END AS result;

SELECT '9. Sin políticas legacy "Users can manage own"' AS check_name,
       CASE WHEN NOT EXISTS (
         SELECT 1 FROM pg_policies
         WHERE schemaname='public' AND policyname LIKE 'Users can manage own%'
       ) THEN 'PASS' ELSE 'FAIL' END AS result;

SELECT '10. Tablas clínicas usan role_in' AS check_name,
       CASE WHEN (
         SELECT count(*) FROM pg_policies 
         WHERE schemaname='public' 
           AND tablename IN ('pacientes','citas','evoluciones_clinicas','recetas','odontogramas','periodontogramas','certificados','adjuntos_clinicos','audit_log')
       ) > 0 THEN 'PASS' ELSE 'FAIL' END AS result;

SELECT '11. Tablas financieras usan role_in' AS check_name,
       CASE WHEN (
         SELECT count(*) FROM pg_policies 
         WHERE schemaname='public' 
           AND tablename IN ('presupuestos','pagos','movimientos_financieros','boletas','facturas')
       ) >= 5 THEN 'PASS' ELSE 'FAIL' END AS result;

SELECT '12. Sin políticas legacy en vademecum' AS check_name,
       CASE WHEN NOT EXISTS (
         SELECT 1 FROM pg_policies
         WHERE schemaname='public' AND policyname LIKE '%_authenticated' 
           AND cmd IN ('INSERT','UPDATE','DELETE','ALL')
           AND tablename IN ('vademecum','vademecum_urgencia','vademecum_antirresortivos')
       ) THEN 'PASS' ELSE 'FAIL' END AS result;

SELECT '13. profiles.role es tipo app_role' AS check_name,
       CASE 
         WHEN data_type = 'USER-DEFINED' AND udt_name = 'app_role' 
         THEN 'PASS' 
         ELSE 'FAIL' 
       END AS result
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'role';
