-- F6-Ib: Limpiar datos de E2E del proyecto original (nagduvivilmzupdpoayo) — VERSIÓN CORREGIDA
-- 
-- ⚠️ EJECUTAR EN: PROYECTO ORIGINAL (nagduvivilmzupdpoayo) — NO EN STAGING NI PRODUCCIÓN
-- 📍 DÓNDE: https://supabase.com/dashboard/project/nagduvivilmzupdpoayo/sql
-- 🎯 PROPÓSITO: Borrar usuarios y datos de E2E del proyecto original
-- ⏱️ TIEMPO ESTIMADO: 10 segundos
-- ⚠️ IMPORTANTE: 
--   - Solo ejecutar si el script de verificación muestra datos de E2E
--   - Los usuarios e2e_* serán eliminados permanentemente
--   - Los datos asociados (pacientes, citas, etc.) serán eliminados
--   - Este script maneja correctamente las foreign keys

-- Iniciar transacción para seguridad
BEGIN;

-- ============================================================
-- PASO 1: Borrar de tablas que referencian a auth.users
-- ============================================================

-- 1.1 Borrar perfiles de usuarios e2e (foreign key profiles_id_fkey)
DELETE FROM public.profiles
WHERE id IN (
  SELECT id FROM auth.users WHERE email LIKE 'e2e_%@studiodental.com'
);

-- 1.2 Borrar audit_log de usuarios e2e
DELETE FROM public.audit_log
WHERE user_email LIKE 'e2e_%@studiodental.com';

-- 1.3 Borrar membresías de usuarios e2e
DELETE FROM public.miembros_clinica
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'e2e_%@studiodental.com'
);

-- ============================================================
-- PASO 2: Borrar datos clínicos de usuarios e2e
-- ============================================================

-- 2.1 Borrar odontogramas de usuarios e2e
DELETE FROM public.odontogramas
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'e2e_%@studiodental.com'
);

-- 2.2 Borrar periodontogramas de usuarios e2e
DELETE FROM public.periodontogramas
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'e2e_%@studiodental.com'
);

-- 2.3 Borrar evoluciones clínicas de usuarios e2e
DELETE FROM public.evoluciones_clinicas
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'e2e_%@studiodental.com'
);

-- 2.4 Borrar recetas de usuarios e2e
DELETE FROM public.recetas
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'e2e_%@studiodental.com'
);

-- ============================================================
-- PASO 3: Borrar datos financieros de usuarios e2e
-- ============================================================

-- 3.1 Borrar pagos de usuarios e2e
DELETE FROM public.pagos
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'e2e_%@studiodental.com'
);

-- 3.2 Borrar movimientos financieros de usuarios e2e
DELETE FROM public.movimientos_financieros
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'e2e_%@studiodental.com'
);

-- 3.3 Borrar presupuestos de usuarios e2e
DELETE FROM public.presupuestos
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'e2e_%@studiodental.com'
);

-- ============================================================
-- PASO 4: Borrar citas y pacientes de usuarios e2e
-- ============================================================

-- 4.1 Borrar citas de usuarios e2e
DELETE FROM public.citas
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'e2e_%@studiodental.com'
);

-- 4.2 Borrar pacientes de usuarios e2e
DELETE FROM public.pacientes
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE 'e2e_%@studiodental.com'
);

-- ============================================================
-- PASO 5: Borrar usuarios e2e de auth.users (último paso)
-- ============================================================

DELETE FROM auth.users
WHERE email LIKE 'e2e_%@studiodental.com';

-- Confirmar transacción
COMMIT;

-- ============================================================
-- PASO 6: Verificación post-limpieza
-- ============================================================

SELECT 
  'Verificación post-limpieza' AS check_name,
  CASE WHEN COUNT(*) = 0 THEN '✅ Sin usuarios e2e' ELSE '❌ Aún hay ' || COUNT(*)::text || ' usuarios e2e' END AS status
FROM auth.users
WHERE email LIKE 'e2e_%@studiodental.com';

SELECT 
  'Perfiles de e2e restantes' AS check_name,
  CASE WHEN COUNT(*) = 0 THEN '✅ Sin perfiles' ELSE '❌ Aún hay ' || COUNT(*)::text || ' perfiles' END AS status
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email LIKE 'e2e_%@studiodental.com';

SELECT 
  'Pacientes de e2e restantes' AS check_name,
  CASE WHEN COUNT(*) = 0 THEN '✅ Sin pacientes' ELSE '❌ Aún hay ' || COUNT(*)::text || ' pacientes' END AS status
FROM public.pacientes p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email LIKE 'e2e_%@studiodental.com';

SELECT 
  'Citas de e2e restantes' AS check_name,
  CASE WHEN COUNT(*) = 0 THEN '✅ Sin citas' ELSE '❌ Aún hay ' || COUNT(*)::text || ' citas' END AS status
FROM public.citas c
JOIN auth.users u ON c.user_id = u.id
WHERE u.email LIKE 'e2e_%@studiodental.com';

SELECT 
  'Membresías de e2e restantes' AS check_name,
  CASE WHEN COUNT(*) = 0 THEN '✅ Sin membresías' ELSE '❌ Aún hay ' || COUNT(*)::text || ' membresías' END AS status
FROM public.miembros_clinica mc
JOIN auth.users u ON mc.user_id = u.id
WHERE u.email LIKE 'e2e_%@studiodental.com';

SELECT 
  'Odontogramas de e2e restantes' AS check_name,
  CASE WHEN COUNT(*) = 0 THEN '✅ Sin odontogramas' ELSE '❌ Aún hay ' || COUNT(*)::text || ' odontogramas' END AS status
FROM public.odontogramas o
JOIN auth.users u ON o.user_id = u.id
WHERE u.email LIKE 'e2e_%@studiodental.com';
