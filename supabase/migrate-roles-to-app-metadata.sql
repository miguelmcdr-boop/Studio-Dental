-- ============================================================
-- Migración de roles existentes a app_metadata (F6-B3)
--
-- ⚠️ EJECUTAR UNA SOLA VEZ en el proyecto objetivo (cloud/dev),
--    con service_role o desde el SQL Editor del Dashboard.
--    NO ejecutar en un proyecto local limpio (no hay usuarios).
--
-- Sincroniza profiles.role -> auth.users.raw_app_meta_data.role
-- para que los JWT existentes lleven el rol y las políticas
-- de F6-B1/B2/B3 funcionen sin recrear usuarios.
-- ============================================================
UPDATE auth.users u
SET raw_app_meta_data = COALESCE(u.raw_app_meta_data, '{}'::jsonb)
                        || jsonb_build_object('role', p.role)
FROM public.profiles p
WHERE p.id = u.id
  AND p.role IN ('admin', 'dentista', 'asistente', 'recepcion');

-- Verificación: usuarios con rol sincronizado
SELECT u.email,
       u.raw_app_meta_data ->> 'role' AS rol_app_meta,
       p.role AS rol_profile
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
ORDER BY u.email;
