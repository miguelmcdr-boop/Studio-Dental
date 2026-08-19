-- ============================================================
-- F6-C-b: Migración de datos existentes a clínica inicial
-- ============================================================
-- Alcance:
-- 1. Crear clínica inicial (id fijo)
-- 2. Crear membresías para todos los usuarios existentes
--    Rol: profiles.role -> fallback app_metadata -> fail-safe 'recepcion'
-- NO toca las 18 tablas (eso es F6-C-c)
-- Ejecutar en SQL Editor local (rol postgres, bypass RLS)
-- Idempotente: seguro re-ejecutar
-- ============================================================

-- Bloque 1: migración con validación (se revierte automáticamente si falla)
DO $$
DECLARE
  v_total_usuarios int;
  v_total_membresias int;
BEGIN
  -- 1. Clínica inicial (idempotente)
  INSERT INTO public.clinicas (id, nombre)
  VALUES ('00000000-0000-0000-0000-000000000001', 'Clínica Studio Dental')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Membresías para todos los usuarios existentes
  -- Rol: profiles.role (validado en F6-B) -> fallback app_metadata -> fail-safe 'recepcion'
  INSERT INTO public.miembros_clinica (clinica_id, user_id, rol, activo)
  SELECT
    '00000000-0000-0000-0000-000000000001'::uuid AS clinica_id,
    u.id AS user_id,
    CASE
      WHEN p.role IN ('admin', 'dentista', 'asistente', 'recepcion') THEN p.role
      WHEN u.raw_app_meta_data->>'role' IN ('admin', 'dentista', 'asistente', 'recepcion') THEN u.raw_app_meta_data->>'role'
      ELSE 'recepcion'
    END AS rol,
    true AS activo
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  ON CONFLICT (clinica_id, user_id) DO NOTHING;

  -- 3. Validación dentro de la misma transacción
  SELECT count(*) INTO v_total_usuarios FROM auth.users;
  SELECT count(*) INTO v_total_membresias
    FROM public.miembros_clinica
    WHERE clinica_id = '00000000-0000-0000-0000-000000000001'::uuid AND activo;

  IF v_total_usuarios <> v_total_membresias THEN
    RAISE EXCEPTION 'Migración falló: % usuarios pero % membresías activas', v_total_usuarios, v_total_membresias;
  END IF;

  RAISE NOTICE 'Migración exitosa: % usuarios con membresía activa en la clínica inicial', v_total_membresias;
END;
$$;

-- Bloque 2: verificación visible (solo se ejecuta si el Bloque 1 tuvo éxito)
SELECT
  u.email,
  p.role AS rol_profiles,
  u.raw_app_meta_data->>'role' AS rol_app_meta,
  mc.rol AS rol_membresia,
  mc.activo
FROM public.miembros_clinica mc
JOIN auth.users u ON u.id = mc.user_id
LEFT JOIN public.profiles p ON p.id = u.id
WHERE mc.clinica_id = '00000000-0000-0000-0000-000000000001'::uuid
ORDER BY u.email;