-- ============================================================
-- F6-C-b: Verificación de migración a clínica inicial
-- ============================================================
-- Solo lectura, idempotente. Ejecutar en SQL Editor local.
-- ============================================================

DROP TABLE IF EXISTS _migracion_verify;
CREATE TEMP TABLE _migracion_verify (id serial, check_name text, result text, detail text);

-- 1. Clínica inicial existe
INSERT INTO _migracion_verify (check_name, result, detail)
SELECT '1. clínica inicial existe',
       CASE WHEN EXISTS (SELECT 1 FROM public.clinicas WHERE id = '00000000-0000-0000-0000-000000000001'::uuid) THEN 'PASS' ELSE 'FAIL' END,
       'id fijo 00000000-...-000000000001';

-- 2. Todos los usuarios tienen membresía activa
INSERT INTO _migracion_verify (check_name, result, detail)
SELECT '2. todos los usuarios tienen membresía activa',
       CASE WHEN (SELECT count(*) FROM auth.users) = (SELECT count(*) FROM public.miembros_clinica WHERE clinica_id = '00000000-0000-0000-0000-000000000001'::uuid AND activo) THEN 'PASS' ELSE 'FAIL' END,
       (SELECT (SELECT count(*) FROM auth.users) || ' usuarios / ' || (SELECT count(*) FROM public.miembros_clinica WHERE clinica_id = '00000000-0000-0000-0000-000000000001'::uuid AND activo) || ' membresías');

-- 3. No hay membresías con rol inválido
INSERT INTO _migracion_verify (check_name, result, detail)
SELECT '3. todas las membresías tienen rol válido',
       CASE WHEN NOT EXISTS (SELECT 1 FROM public.miembros_clinica WHERE rol NOT IN ('admin','dentista','asistente','recepcion')) THEN 'PASS' ELSE 'FAIL' END,
       'roles: admin/dentista/asistente/recepcion';

-- 4. No hay membresías duplicadas (clinica_id, user_id)
INSERT INTO _migracion_verify (check_name, result, detail)
SELECT '4. sin membresías duplicadas',
       CASE WHEN NOT EXISTS (
         SELECT clinica_id, user_id FROM public.miembros_clinica
         GROUP BY clinica_id, user_id HAVING count(*) > 1
       ) THEN 'PASS' ELSE 'FAIL' END,
       'unique(clinica_id, user_id)';

-- Resumen
SELECT check_name, result, detail FROM _migracion_verify ORDER BY id;
SELECT count(*) FILTER (WHERE result='PASS') AS pass,
       count(*) FILTER (WHERE result='FAIL') AS fail,
       count(*) AS total
FROM _migracion_verify;

-- Informativo: distribución de roles en la clínica inicial
SELECT rol, count(*) AS cantidad
FROM public.miembros_clinica
WHERE clinica_id = '00000000-0000-0000-0000-000000000001'::uuid
GROUP BY rol ORDER BY rol;