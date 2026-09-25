-- ============================================================
-- F7-35: Backfill one-time de user_metadata.clinica_id
-- ============================================================
--
-- CONTEXTO (hallazgo F7-35, SQL I1 de producción):
-- 5 de 7 usuarios de producción NO tienen metadata clinica_id.
-- Sin backfill, al activar clinica_actual() fail-closed, estos 5
-- usuarios perderían acceso al sistema.
--
-- SOLUCIÓN: UPDATE idempotente de auth.users.raw_user_meta_data
-- para setear clinica_id = primera membresía activa (ORDER BY clinica_id).
--
-- DECISIÓN DE PRODUCTO (explícita, documentada):
-- Esta es una decisión de continuidad UX, no silenciosa. Tras ejecutar,
-- la app sigue funcionando igual para todos. Después del backfill,
-- "metadata ausente" solo ocurre para anomalías de sesión → fail-closed real.
--
-- SEGURIDAD:
-- - Solo afecta a usuarios sin selector actual
-- - Solo setea clinica_id a una clínica de la que YA son miembros activos
-- - Idempotente: ejecutar dos veces es seguro
-- - El JWT del cliente se refresca en el siguiente refreshSession o login
-- ============================================================

-- Backfill: para cada usuario con membresía activa pero sin selector válido,
-- setear clinica_id a la primera membresía activa.
UPDATE auth.users u
SET raw_user_meta_data = jsonb_set(
  COALESCE(u.raw_user_meta_data, '{}'::jsonb),
  '{clinica_id}',
  to_jsonb((
    SELECT mc.clinica_id::text
    FROM public.miembros_clinica mc
    WHERE mc.user_id = u.id
      AND mc.activo = true
    ORDER BY mc.clinica_id
    LIMIT 1
  ))
)
WHERE EXISTS (
  -- Usuario con membresía activa
  SELECT 1 FROM public.miembros_clinica mc
  WHERE mc.user_id = u.id AND mc.activo = true
)
AND (
  -- Metadata sin clinica_id o con valor no-UUID
  NOT (u.raw_user_meta_data ? 'clinica_id')
  OR NOT (u.raw_user_meta_data->>'clinica_id')
       ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  -- O selector que no corresponde a membresía activa
  OR NOT EXISTS (
    SELECT 1 FROM public.miembros_clinica mc2
    WHERE mc2.user_id = u.id
      AND mc2.activo = true
      AND mc2.clinica_id = (u.raw_user_meta_data->>'clinica_id')::uuid
  )
);

-- Verificación (ejecutar manualmente post-migración):
-- SELECT count(*) FROM auth.users WHERE NOT (raw_user_meta_data ? 'clinica_id');
-- SELECT u.email, u.raw_user_meta_data->>'clinica_id' AS clinica
-- FROM auth.users u
-- JOIN miembros_clinica mc ON mc.user_id = u.id AND mc.activo
-- GROUP BY u.id, u.email, u.raw_user_meta_data;
