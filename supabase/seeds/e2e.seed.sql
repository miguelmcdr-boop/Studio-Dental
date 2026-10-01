-- ============================================================
-- Seed de USUARIOS E2E (F7-21)
-- 6 usuarios E2E para tests de equipo compartido y aislamiento
-- Requiere que los usuarios existan en Supabase Auth (dashboard)
-- y luego se ejecuta para crear profiles + miembros_clinica.
-- ============================================================

-- Profiles de usuarios E2E (se crean vía trigger handle_new_user al crear
-- el usuario en Supabase Auth; este seed actualiza roles y vincula clínicas)

UPDATE profiles SET role = 'admin'::app_role WHERE email = 'e2e_admin@studiodental.com';
UPDATE profiles SET role = 'dentista'::app_role WHERE email = 'e2e_dentista@studiodental.com';
UPDATE profiles SET role = 'asistente'::app_role WHERE email = 'e2e_asistente@studiodental.com';
UPDATE profiles SET role = 'recepcion'::app_role WHERE email = 'e2e_recepcion@studiodental.com';
UPDATE profiles SET role = 'admin'::app_role WHERE email = 'e2e_admin_clinica2@studiodental.com';
UPDATE profiles SET role = 'dentista'::app_role WHERE email = 'e2e_dentista_clinica2@studiodental.com';

-- Vinculaciones a clínicas (4 en principal, 2 en secundaria)
INSERT INTO miembros_clinica (id, clinica_id, user_id, rol, activo)
SELECT 
  gen_random_uuid(),
  CASE au.email
    WHEN 'e2e_admin_clinica2@studiodental.com'   THEN '00000000-0000-0000-0000-000000000002'::uuid
    WHEN 'e2e_dentista_clinica2@studiodental.com' THEN '00000000-0000-0000-0000-000000000002'::uuid
    ELSE '00000000-0000-0000-0000-000000000001'::uuid
  END,
  au.id,
  CASE au.email
    WHEN 'e2e_admin@studiodental.com'            THEN 'admin'
    WHEN 'e2e_dentista@studiodental.com'         THEN 'dentista'
    WHEN 'e2e_asistente@studiodental.com'        THEN 'asistente'
    WHEN 'e2e_recepcion@studiodental.com'        THEN 'recepcion'
    WHEN 'e2e_admin_clinica2@studiodental.com'   THEN 'admin'
    WHEN 'e2e_dentista_clinica2@studiodental.com' THEN 'dentista'
  END,
  true
FROM auth.users au
WHERE au.email IN (
  'e2e_admin@studiodental.com',
  'e2e_dentista@studiodental.com',
  'e2e_asistente@studiodental.com',
  'e2e_recepcion@studiodental.com',
  'e2e_admin_clinica2@studiodental.com',
  'e2e_dentista_clinica2@studiodental.com'
)
AND NOT EXISTS (
  SELECT 1 FROM miembros_clinica mc 
  WHERE mc.user_id = au.id 
    AND mc.clinica_id = CASE au.email
      WHEN 'e2e_admin_clinica2@studiodental.com'   THEN '00000000-0000-0000-0000-000000000002'::uuid
      WHEN 'e2e_dentista_clinica2@studiodental.com' THEN '00000000-0000-0000-0000-000000000002'::uuid
      ELSE '00000000-0000-0000-0000-000000000001'::uuid
    END
);
