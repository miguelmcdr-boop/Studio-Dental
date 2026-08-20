-- F6-C-f: Segunda clínica + usuarios e2e_* para validar aislamiento multi-clínica.
-- Ejecutar UNA SOLA VEZ en el SQL Editor local antes de correr los tests E2E.
-- Todas las operaciones son idempotentes (ON CONFLICT DO NOTHING).

-- 1. Crear segunda clínica
INSERT INTO public.clinicas (id, nombre, rut_empresa, telefono, email_contacto)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Clínica E2E Secundaria',
  '77.777.777-7',
  '+56 9 9999 9999',
  'e2e@clinica2.cl'
) ON CONFLICT (id) DO NOTHING;

-- 2. Crear 2 usuarios en auth.users (admin y dentista de clínica 2)
-- Contraseña: E2eTest2026! (misma que los otros e2e_*)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data)
VALUES
  ('e2e00000-0000-0000-0000-000000000001', 'e2e_admin_clinica2@studiodental.com', crypt('E2eTest2026!', gen_salt('bf')), NOW(), '{"full_name": "Admin Clínica 2"}', '{"role": "admin"}'),
  ('e2e00000-0000-0000-0000-000000000002', 'e2e_dentista_clinica2@studiodental.com', crypt('E2eTest2026!', gen_salt('bf')), NOW(), '{"full_name": "Dentista Clínica 2"}', '{"role": "dentista"}')
ON CONFLICT (id) DO NOTHING;

-- 3. Agregar a miembros_clinica en la clínica 2
INSERT INTO public.miembros_clinica (user_id, clinica_id, rol, activo)
VALUES
  ('e2e00000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'admin', true),
  ('e2e00000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'dentista', true)
ON CONFLICT DO NOTHING;

-- 4. Crear 1 paciente en clínica 2 (para validar aislamiento)
INSERT INTO public.pacientes (id, clinica_id, user_id, nombre, rut)
VALUES (
  'e2e00000-0000-0000-0001-000000000001',
  '00000000-0000-0000-0000-000000000002',
  'e2e00000-0000-0000-0000-000000000001',
  'Paciente Exclusivo Clínica 2',
  '77.777.777-7'
) ON CONFLICT (id) DO NOTHING;
