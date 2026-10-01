-- ============================================================
-- F7-35: Script de verificación de clinica_actual() fail-closed
-- ============================================================
--
-- Uso: ejecutar en SQL Editor de Supabase (producción o staging).
-- Pre-requisito: las migraciones 2026_09_24_0001 y _0002 aplicadas.
--
-- Los 9 escenarios del encargo F7-35 FASE 1:
--   1. Usuario con 1 clínica y metadata correcta → debe retornar esa clínica
--   2. Usuario con 2 clínicas y metadata A → debe retornar A
--   3. Usuario con 2 clínicas y metadata B → debe retornar B
--   4. Metadata ausente → debe retornar NULL (fail-closed)
--   5. Metadata apunta a clínica NO-miembro → debe retornar NULL
--   6. Metadata apunta a membresía inactiva → debe retornar NULL
--   7. Usuario sin ninguna membresía → debe retornar NULL
--   8. JWT desactualizado → se verifica vía refresh en cliente
--   9. Usuario cambia de clínica → se verifica vía setClinicaActiva + refresh
-- ============================================================

-- V1. Verificar que la función existe y tiene la firma F7-35 (SECURITY DEFINER + STABLE)
SELECT proname, prosecdef, provolatile,
       obj_description(oid, 'pg_proc') AS comment
FROM pg_proc WHERE proname = 'clinica_actual';

-- V2. Verificar que es_admin_de_clinica_actual() está acotada a clinica_actual()
SELECT proname, prosecdef,
       obj_description(oid, 'pg_proc') AS comment
FROM pg_proc WHERE proname = 'es_admin_de_clinica_actual';

-- V3. Escenario base: usuario autenticado actual
SELECT
  auth.uid() AS current_user_id,
  public.clinica_actual() AS clinica_actual_result,
  (auth.jwt() -> 'user_metadata' ->> 'clinica_id') AS metadata_clinica_id,
  public.es_admin_de_clinica_actual() AS es_admin;

-- V4. Estado post-backfill: usuarios con membresías vs metadata
SELECT
  count(*) AS total,
  count(*) FILTER (
    WHERE raw_user_meta_data ? 'clinica_id'
      AND (raw_user_meta_data->>'clinica_id')
          ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      AND EXISTS (
        SELECT 1 FROM miembros_clinica mc
        WHERE mc.user_id = u.id AND mc.activo
          AND mc.clinica_id = (u.raw_user_meta_data->>'clinica_id')::uuid
      )
  ) AS selector_valido,
  count(*) FILTER (WHERE NOT (raw_user_meta_data ? 'clinica_id')) AS sin_metadata,
  count(*) FILTER (
    WHERE raw_user_meta_data ? 'clinica_id'
      AND NOT (raw_user_meta_data->>'clinica_id')
          ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  ) AS metadata_no_uuid,
  count(*) FILTER (
    WHERE raw_user_meta_data ? 'clinica_id'
      AND (raw_user_meta_data->>'clinica_id')
          ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      AND NOT EXISTS (
        SELECT 1 FROM miembros_clinica mc
        WHERE mc.user_id = u.id AND mc.activo
          AND mc.clinica_id = (u.raw_user_meta_data->>'clinica_id')::uuid
      )
  ) AS selector_invalido
FROM auth.users u;

-- V5. Listado de usuarios con membresías y selector post-backfill
SELECT u.email,
       (SELECT count(*) FROM miembros_clinica mc WHERE mc.user_id = u.id AND mc.activo)
         AS membresias_activas,
       u.raw_user_meta_data->>'clinica_id' AS selector
FROM auth.users u
WHERE EXISTS (
  SELECT 1 FROM miembros_clinica mc WHERE mc.user_id = u.id AND mc.activo
)
ORDER BY u.email;

-- V6. Verificar que clinica_actual() NO tiene fallback silencioso
--     (buscar en el source de la función el string "ORDER BY")
SELECT prosrc
FROM pg_proc
WHERE proname = 'clinica_actual';
-- Debe contener el regex-guard y NO contener "ORDER BY" ni "COALESCE"
