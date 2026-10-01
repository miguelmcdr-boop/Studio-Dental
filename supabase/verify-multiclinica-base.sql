-- ============================================================
-- F6-C-a: Verificación de esquema multi-clínica base
-- ============================================================
-- Solo lectura, idempotente. Ejecutar en SQL Editor local.
-- Verifica que las tablas y funciones de F6-C-a existen.
-- ============================================================

DROP TABLE IF EXISTS _multiclinica_verify;
CREATE TEMP TABLE _multiclinica_verify (id serial, check_name text, result text, detail text);

-- 1. Tabla clinicas existe
INSERT INTO _multiclinica_verify (check_name, result, detail)
SELECT '1. tabla clinicas existe',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clinicas') THEN 'PASS' ELSE 'FAIL' END,
       'public.clinicas';

-- 2. Tabla miembros_clinica existe
INSERT INTO _multiclinica_verify (check_name, result, detail)
SELECT '2. tabla miembros_clinica existe',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='miembros_clinica') THEN 'PASS' ELSE 'FAIL' END,
       'public.miembros_clinica';

-- 3. Índice único en rut_empresa
INSERT INTO _multiclinica_verify (check_name, result, detail)
SELECT '3. índice único idx_clinicas_rut existe',
       CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='clinicas' AND indexname='idx_clinicas_rut') THEN 'PASS' ELSE 'FAIL' END,
       'clinicas';

-- 4. Índices compuestos en miembros_clinica
INSERT INTO _multiclinica_verify (check_name, result, detail)
SELECT '4. índice idx_miembros_usuario existe',
       CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='miembros_clinica' AND indexname='idx_miembros_usuario') THEN 'PASS' ELSE 'FAIL' END,
       'miembros_clinica';

INSERT INTO _multiclinica_verify (check_name, result, detail)
SELECT '5. índice idx_miembros_clinica existe',
       CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='miembros_clinica' AND indexname='idx_miembros_clinica') THEN 'PASS' ELSE 'FAIL' END,
       'miembros_clinica';

-- 6. Función clinica_actual() existe
INSERT INTO _multiclinica_verify (check_name, result, detail)
SELECT '6. función clinica_actual() existe',
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='public' AND p.proname='clinica_actual') THEN 'PASS' ELSE 'FAIL' END,
       'public';

-- 7. Función es_admin_de_clinica_actual() existe
INSERT INTO _multiclinica_verify (check_name, result, detail)
SELECT '7. función es_admin_de_clinica_actual() existe',
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace=n.oid WHERE n.nspname='public' AND p.proname='es_admin_de_clinica_actual') THEN 'PASS' ELSE 'FAIL' END,
       'public';

-- 8. Políticas RLS en clinicas
INSERT INTO _multiclinica_verify (check_name, result, detail)
SELECT '8. política miembros_leen_su_clinica existe',
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='clinicas' AND policyname='miembros_leen_su_clinica') THEN 'PASS' ELSE 'FAIL' END,
       'clinicas';

INSERT INTO _multiclinica_verify (check_name, result, detail)
SELECT '9. política admin_actualiza_su_clinica existe',
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='clinicas' AND policyname='admin_actualiza_su_clinica') THEN 'PASS' ELSE 'FAIL' END,
       'clinicas';

-- 9. Políticas RLS en miembros_clinica
INSERT INTO _multiclinica_verify (check_name, result, detail)
SELECT '10. política miembros_leen_membresias existe',
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='miembros_clinica' AND policyname='miembros_leen_membresias') THEN 'PASS' ELSE 'FAIL' END,
       'miembros_clinica';

INSERT INTO _multiclinica_verify (check_name, result, detail)
SELECT '11. política admin_gestiona_miembros existe',
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='miembros_clinica' AND policyname='admin_gestiona_miembros') THEN 'PASS' ELSE 'FAIL' END,
       'miembros_clinica';

-- 10. RLS habilitado en ambas tablas
INSERT INTO _multiclinica_verify (check_name, result, detail)
SELECT '12. RLS habilitado en clinicas',
       CASE WHEN EXISTS (SELECT 1 FROM pg_class WHERE relname='clinicas' AND relrowsecurity=true) THEN 'PASS' ELSE 'FAIL' END,
       'clinicas';

INSERT INTO _multiclinica_verify (check_name, result, detail)
SELECT '13. RLS habilitado en miembros_clinica',
       CASE WHEN EXISTS (SELECT 1 FROM pg_class WHERE relname='miembros_clinica' AND relrowsecurity=true) THEN 'PASS' ELSE 'FAIL' END,
       'miembros_clinica';

-- Resumen
SELECT check_name, result, detail FROM _multiclinica_verify ORDER BY id;
SELECT count(*) FILTER (WHERE result='PASS') AS pass,
       count(*) FILTER (WHERE result='FAIL') AS fail,
       count(*) AS total
FROM _multiclinica_verify;
