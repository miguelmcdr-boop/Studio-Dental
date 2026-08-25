-- F6-Ib: Verificar datos de E2E en proyecto original (nagduvivilmzupdpoayo)
-- 
-- ⚠️ EJECUTAR EN: PROYECTO ORIGINAL (nagduvivilmzupdpoayo) — NO EN STAGING NI PRODUCCIÓN
-- 📍 DÓNDE: https://supabase.com/dashboard/project/nagduvivilmzupdpoayo/sql
-- 🎯 PROPÓSITO: Verificar qué datos de E2E existen antes de borrarlos
-- ⏱️ TIEMPO ESTIMADO: 5 segundos
-- ✅ RESULTADO ESPERADO: Lista de usuarios y datos de prueba

-- 1. Verificar usuarios e2e_* en auth.users
SELECT 
  'Usuarios e2e en auth.users' AS check_name,
  COUNT(*)::text || ' usuarios encontrados' AS status
FROM auth.users
WHERE email LIKE 'e2e_%@studiodental.com';

-- 2. Listar usuarios e2e encontrados
SELECT 
  id,
  email,
  created_at,
  raw_app_meta_data->>'role' AS rol
FROM auth.users
WHERE email LIKE 'e2e_%@studiodental.com'
ORDER BY email;

-- 3. Verificar pacientes creados por usuarios e2e
SELECT 
  'Pacientes de usuarios e2e' AS check_name,
  COUNT(*)::text || ' pacientes' AS status
FROM public.pacientes p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email LIKE 'e2e_%@studiodental.com';

-- 4. Verificar citas creadas por usuarios e2e
SELECT 
  'Citas de usuarios e2e' AS check_name,
  COUNT(*)::text || ' citas' AS status
FROM public.citas c
JOIN auth.users u ON c.user_id = u.id
WHERE u.email LIKE 'e2e_%@studiodental.com';

-- 5. Verificar presupuestos creados por usuarios e2e
SELECT 
  'Presupuestos de usuarios e2e' AS check_name,
  COUNT(*)::text || ' presupuestos' AS status
FROM public.presupuestos p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email LIKE 'e2e_%@studiodental.com';

-- 6. Verificar pagos creados por usuarios e2e
SELECT 
  'Pagos de usuarios e2e' AS check_name,
  COUNT(*)::text || ' pagos' AS status
FROM public.pagos p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email LIKE 'e2e_%@studiodental.com';

-- 7. Verificar movimientos financieros creados por usuarios e2e
SELECT 
  'Movimientos financieros de usuarios e2e' AS check_name,
  COUNT(*)::text || ' movimientos' AS status
FROM public.movimientos_financieros m
JOIN auth.users u ON m.user_id = u.id
WHERE u.email LIKE 'e2e_%@studiodental.com';

-- 8. Verificar evoluciones clínicas creadas por usuarios e2e
SELECT 
  'Evoluciones clínicas de usuarios e2e' AS check_name,
  COUNT(*)::text || ' evoluciones' AS status
FROM public.evoluciones_clinicas e
JOIN auth.users u ON e.user_id = u.id
WHERE u.email LIKE 'e2e_%@studiodental.com';

-- 9. Verificar recetas creadas por usuarios e2e
SELECT 
  'Recetas de usuarios e2e' AS check_name,
  COUNT(*)::text || ' recetas' AS status
FROM public.recetas r
JOIN auth.users u ON r.user_id = u.id
WHERE u.email LIKE 'e2e_%@studiodental.com';

-- 10. Verificar audit_log de usuarios e2e
SELECT 
  'Registros en audit_log de usuarios e2e' AS check_name,
  COUNT(*)::text || ' registros' AS status
FROM public.audit_log
WHERE user_email LIKE 'e2e_%@studiodental.com';

-- 11. Verificar miembros_clinica de usuarios e2e
SELECT 
  'Membresías de usuarios e2e' AS check_name,
  COUNT(*)::text || ' membresías' AS status
FROM public.miembros_clinica mc
JOIN auth.users u ON mc.user_id = u.id
WHERE u.email LIKE 'e2e_%@studiodental.com';

-- 12. Verificar odontogramas creados por usuarios e2e
SELECT 
  'Odontogramas de usuarios e2e' AS check_name,
  COUNT(*)::text || ' odontogramas' AS status
FROM public.odontogramas o
JOIN auth.users u ON o.user_id = u.id
WHERE u.email LIKE 'e2e_%@studiodental.com';

-- 13. Verificar periodontogramas creados por usuarios e2e
SELECT 
  'Periodontogramas de usuarios e2e' AS check_name,
  COUNT(*)::text || ' periodontogramas' AS status
FROM public.periodontogramas p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email LIKE 'e2e_%@studiodental.com';
