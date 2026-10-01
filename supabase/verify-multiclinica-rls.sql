-- ============================================================
-- F6-C-c: Verificación de reescritura de políticas RLS
-- ============================================================
-- Solo lectura, idempotente. Ejecutar en SQL Editor local.
-- Verifica la reescritura estructural de políticas a aislamiento por clínica.
-- ============================================================

DROP TABLE IF EXISTS _rls_multiclinica_verify;
CREATE TEMP TABLE _rls_multiclinica_verify (id serial, check_name text, result text, detail text);

INSERT INTO _rls_multiclinica_verify (check_name, result, detail)
SELECT '1. función rol_en_clinica_actual() existe',
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='public' AND p.proname='rol_en_clinica_actual') THEN 'PASS' ELSE 'FAIL' END,
       'public';

INSERT INTO _rls_multiclinica_verify (check_name, result, detail)
SELECT '2. función tiene_rol_en_clinica() existe',
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='public' AND p.proname='tiene_rol_en_clinica') THEN 'PASS' ELSE 'FAIL' END,
       'public';

INSERT INTO _rls_multiclinica_verify (check_name, result, detail)
SELECT '3. las 18 tablas tienen políticas _clinica',
       CASE WHEN (SELECT count(DISTINCT tablename) FROM pg_policies WHERE schemaname='public' AND policyname LIKE '%_clinica' AND tablename IN (
         'pacientes','citas','prestaciones','presupuestos','presupuesto_items','pagos',
         'movimientos_financieros','inventario','evoluciones_clinicas','recetas',
         'odontogramas','periodontogramas','periodontogramas_historial','dsd_configs',
         'odontopediatria','quirurgico_implantes','quirurgico_endodoncia','audit_log'
       )) = 18 THEN 'PASS' ELSE 'FAIL' END,
       (SELECT count(DISTINCT tablename)::text || ' de 18 tablas' FROM pg_policies WHERE schemaname='public' AND policyname LIKE '%_clinica' AND tablename IN (
         'pacientes','citas','prestaciones','presupuestos','presupuesto_items','pagos',
         'movimientos_financieros','inventario','evoluciones_clinicas','recetas',
         'odontogramas','periodontogramas','periodontogramas_historial','dsd_configs',
         'odontopediatria','quirurgico_implantes','quirurgico_endodoncia','audit_log'));

INSERT INTO _rls_multiclinica_verify (check_name, result, detail)
SELECT '4. sin políticas viejas _rol residuales',
       CASE WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND policyname LIKE '%_rol' AND tablename IN (
         'pacientes','citas','prestaciones','presupuestos','presupuesto_items','pagos',
         'movimientos_financieros','inventario','evoluciones_clinicas','recetas',
         'odontogramas','periodontogramas','periodontogramas_historial','dsd_configs',
         'odontopediatria','quirurgico_implantes','quirurgico_endodoncia','audit_log'
       )) THEN 'PASS' ELSE 'FAIL' END,
       'tablas multi-clínica';

INSERT INTO _rls_multiclinica_verify (check_name, result, detail)
SELECT '5. audit_log tiene sus 3 políticas',
       CASE WHEN (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='audit_log') = 3 THEN 'PASS' ELSE 'FAIL' END,
       'insert_clinica + select_own + select_admin';

SELECT check_name, result, detail FROM _rls_multiclinica_verify ORDER BY id;
SELECT count(*) FILTER (WHERE result='PASS') AS pass, count(*) FILTER (WHERE result='FAIL') AS fail, count(*) AS total FROM _rls_multiclinica_verify;
