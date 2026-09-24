-- ============================================================================
-- F7-34: Fixtures para validación manual de Edge Functions multi-clínica
-- Ejecutar en: staging (bjuqqtkiqnfyejitmowc)
-- ============================================================================

BEGIN;

-- 1. Crear 2 clínicas de prueba
INSERT INTO public.clinicas (id, nombre, rut, direccion, telefono, email, activa, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Clínica Staging A', '76.123.456-7', 'Av. Providencia 1234', '+56911111111', 'staging-a@test.com', true, NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Clínica Staging B', '76.987.654-3', 'Av. Las Condes 5678', '+56922222222', 'staging-b@test.com', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Crear pacientes de prueba (2 por clínica)
INSERT INTO public.pacientes (
  id, clinica_id, nombre, rut, telefono, email, fecha_nacimiento, 
  genero, alergias, enfermedades, created_at, updated_at
)
VALUES
  -- Clínica A: 2 pacientes
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Juan Pérez (Clínica A)',
    '11.111.111-1',
    '+56911111111',
    'juan.a@test.com',
    '1980-01-15',
    'masculino',
    'Penicilina',
    'Hipertensión controlada',
    NOW(),
    NOW()
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    'María López (Clínica A)',
    '22.222.222-2',
    '+56922222222',
    'maria.a@test.com',
    '1985-06-20',
    'femenino',
    '',
    '',
    NOW(),
    NOW()
  ),
  -- Clínica B: 2 pacientes
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '22222222-2222-2222-2222-222222222222',
    'Carlos Rodríguez (Clínica B)',
    '33.333.333-3',
    '+56933333333',
    'carlos.b@test.com',
    '1990-03-10',
    'masculino',
    '',
    'Diabetes tipo 2',
    NOW(),
    NOW()
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '22222222-2222-2222-2222-222222222222',
    'Ana Martínez (Clínica B)',
    '44.444.444-4',
    '+56944444444',
    'ana.b@test.com',
    '1992-09-25',
    'femenino',
    'Ibuprofeno',
    '',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Crear archivos clínicos de prueba (2 por clínica: 1 activo + 1 eliminado)
INSERT INTO public.archivos_clinicos (
  id, clinica_id, paciente_id, nombre_archivo, mime_type, tamano_bytes,
  categoria, r2_object_key, estado, uploaded_by, created_at, deleted_at
)
VALUES
  -- Clínica A: 1 activo + 1 eliminado
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'radiografia_juan_clinica_a.jpg',
    'image/jpeg',
    1048576,
    'radiografia',
    '11111111-1111-1111-1111-111111111111/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/radiografia/eeeeeeee-radiografia_juan.jpg',
    'activo',
    NULL,
    NOW(),
    NULL
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'foto_maria_clinica_a.jpg',
    'image/jpeg',
    524288,
    'foto_clinica',
    '11111111-1111-1111-1111-111111111111/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/foto_clinica/ffffffff-foto_maria.jpg',
    'eliminado',
    NULL,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),
  -- Clínica B: 1 activo + 1 eliminado
  (
    'gggggggg-gggg-gggg-gggg-gggggggggggg',
    '22222222-2222-2222-2222-222222222222',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'radiografia_carlos_clinica_b.jpg',
    'image/jpeg',
    1048576,
    'radiografia',
    '22222222-2222-2222-2222-222222222222/cccccccc-cccc-cccc-cccc-cccccccccccc/radiografia/gggggggg-radiografia_carlos.jpg',
    'activo',
    NULL,
    NOW(),
    NULL
  ),
  (
    'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh',
    '22222222-2222-2222-2222-222222222222',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'foto_ana_clinica_b.jpg',
    'image/jpeg',
    524288,
    'foto_clinica',
    '22222222-2222-2222-2222-222222222222/dddddddd-dddd-dddd-dddd-dddddddddddd/foto_clinica/hhhhhhhh-foto_ana.jpg',
    'eliminado',
    NULL,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days'
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ============================================================================
-- INSTRUCCIONES POST-EJECUCIÓN:
-- ============================================================================
-- 1. Crear usuarios en Supabase Dashboard (Authentication → Add user):
--    - admin-a@staging.test / Password: Test1234!
--    - dentista-a@staging.test / Password: Test1234!
--    - admin-b@staging.test / Password: Test1234!
--    - dentista-b@staging.test / Password: Test1234!
--
-- 2. Copiar los user_id generados (UUIDs)
--
-- 3. Crear membresías (reemplazar {USER_ID_*} con UUIDs reales):
--    INSERT INTO public.miembros_clinica (user_id, clinica_id, rol, activo, created_at)
--    VALUES
--      ('{USER_ID_ADMIN_A}', '11111111-1111-1111-1111-111111111111', 'admin', true, NOW()),
--      ('{USER_ID_DENTISTA_A}', '11111111-1111-1111-1111-111111111111', 'dentista', true, NOW()),
--      ('{USER_ID_ADMIN_B}', '22222222-2222-2222-2222-222222222222', 'admin', true, NOW()),
--      ('{USER_ID_DENTISTA_B}', '22222222-2222-2222-2222-222222222222', 'dentista', true, NOW());
--
-- 4. Actualizar uploaded_by de archivos con user_id reales:
--    UPDATE public.archivos_clinicos SET uploaded_by = '{USER_ID_ADMIN_A}' WHERE id = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
--    UPDATE public.archivos_clinicos SET uploaded_by = '{USER_ID_DENTISTA_A}' WHERE id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
--    UPDATE public.archivos_clinicos SET uploaded_by = '{USER_ID_ADMIN_B}' WHERE id = 'gggggggg-gggg-gggg-gggg-gggggggggggg';
--    UPDATE public.archivos_clinicos SET uploaded_by = '{USER_ID_DENTISTA_B}' WHERE id = 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh';
--
-- 5. Verificar login de usuarios y proceder con tests de Edge Functions
-- ============================================================================
