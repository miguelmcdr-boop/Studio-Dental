-- ============================================================
-- Studio Dental — Verificación de esquema RBAC (F6-B5)
-- Solo lectura, idempotente. Ejecutar en SQL Editor.
-- Verifica que los objetos de F6-B1/B2/B3 existen y que las
-- políticas usan role_in(). Reporta PASS/FAIL por assertion.
-- ============================================================

DROP TABLE IF EXISTS _rbac_verify;
CREATE TEMP TABLE _rbac_verify (id serial, check_name text, result text, detail text);

INSERT INTO _rbac_verify (check_name, result, detail)
SELECT '1. enum app_role existe',
       CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname='app_role') THEN 'PASS' ELSE 'FAIL' END,
       'pg_type';

INSERT INTO _rbac_verify (check_name, result, detail)
SELECT '2. app_role tiene 4 valores correctos',
       CASE WHEN
         (SELECT count(*) FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='app_role') = 4
         AND EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='app_role' AND e.enumlabel='admin')
         AND EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='app_role' AND e.enumlabel='dentista')
         AND EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='app_role' AND e.enumlabel='asistente')
         AND EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='app_role' AND e.enumlabel='recepcion')
       THEN 'PASS' ELSE 'FAIL' END,
       (SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder) FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='app_role');

INSERT INTO _rbac_verify (check_name, result, detail)
SELECT '3. current_role() existe',
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='public' AND p.proname='current_role') THEN 'PASS' ELSE 'FAIL' END, 'public';
INSERT INTO _rbac_verify (check_name, result, detail)
SELECT '4. has_role() existe',
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='public' AND p.proname='has_role') THEN 'PASS' ELSE 'FAIL' END, 'public';
INSERT INTO _rbac_verify (check_name, result, detail)
SELECT '5. is_admin() existe',
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='public' AND p.proname='is_admin') THEN 'PASS' ELSE 'FAIL' END, 'public';
INSERT INTO _rbac_verify (check_name, result, detail)
SELECT '6. role_in() existe',
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='public' AND p.proname='role_in') THEN 'PASS' ELSE 'FAIL' END, 'public';

INSERT INTO _rbac_verify (check_name, result, detail)
SELECT '7. trigger on_auth_user_created existe (F6-B1)',
       CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='on_auth_user_created') THEN 'PASS' ELSE 'FAIL' END, 'auth.users';
INSERT INTO _rbac_verify (check_name, result, detail)
SELECT '8. trigger lock_profiles_role existe (F6-B2)',
       CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='lock_profiles_role') THEN 'PASS' ELSE 'FAIL' END, 'profiles';

INSERT INTO _rbac_verify (check_name, result, detail)
SELECT '9. Sin políticas legacy "Users can manage own"',
       CASE WHEN NOT EXISTS (
         SELECT 1 FROM pg_policies
         WHERE schemaname='public' AND policyname LIKE 'Users can manage own%'
           AND tablename IN ('recetas','evoluciones_clinicas','odontogramas','periodontogramas','periodontogramas_historial','dsd_configs','odontopediatria','quirurgico_implantes','quirurgico_endodoncia','presupuestos','presupuesto_items','movimientos_financieros','pagos','inventario')
       ) THEN 'PASS' ELSE 'FAIL' END, 'FOR ALL ownership eliminado';

INSERT INTO _rbac_verify (check_name, result, detail)
SELECT '10. Tablas clínicas usan role_in',
       CASE WHEN NOT EXISTS (
         SELECT 1 FROM (VALUES ('recetas'),('evoluciones_clinicas'),('odontogramas'),('periodontogramas'),('periodontogramas_historial'),('dsd_configs'),('odontopediatria'),('quirurgico_implantes'),('quirurgico_endodoncia')) AS t(tbl)
         WHERE NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=t.tbl AND (p.qual LIKE '%role_in%' OR p.with_check LIKE '%role_in%'))
       ) THEN 'PASS' ELSE 'FAIL' END, '9 tablas clínicas';

INSERT INTO _rbac_verify (check_name, result, detail)
SELECT '11. Tablas financieras usan role_in',
       CASE WHEN NOT EXISTS (
         SELECT 1 FROM (VALUES ('presupuestos'),('presupuesto_items'),('movimientos_financieros'),('pagos'),('inventario')) AS t(tbl)
         WHERE NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname='public' AND p.tablename=t.tbl AND (p.qual LIKE '%role_in%' OR p.with_check LIKE '%role_in%'))
       ) THEN 'PASS' ELSE 'FAIL' END, '5 tablas financieras';

INSERT INTO _rbac_verify (check_name, result, detail)
SELECT '12. Sin políticas *_authenticated de escritura en vademécum',
       CASE WHEN NOT EXISTS (
         SELECT 1 FROM pg_policies
         WHERE schemaname='public' AND policyname LIKE '%_authenticated' AND cmd IN ('INSERT','UPDATE','DELETE','ALL')
           AND tablename IN ('vademecum','vademecum_urgencia','vademecum_antirresortivos','alergias_cruzadas','interacciones_farmacologicas','profilaxis_endocarditis','manejo_anticoagulantes','reference_data_meta')
       ) THEN 'PASS' ELSE 'FAIL' END, 'F6-A legacy eliminado';

SELECT check_name, result, detail FROM _rbac_verify ORDER BY id;
SELECT count(*) FILTER (WHERE result='PASS') AS pass,
       count(*) FILTER (WHERE result='FAIL') AS fail,
       count(*) AS total
FROM _rbac_verify;
