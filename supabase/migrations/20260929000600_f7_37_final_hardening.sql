-- F7-37 FINAL HARDENING
-- Migración 000600: Endurecimiento final de permisos + validación fail-closed
--
-- CONTEXTO (actualizado 2026-09-29):
-- F7-37 encontró en PRODUCCIÓN que 13 funciones SECURITY DEFINER tienen PUBLIC ACCESS
-- (el =X al inicio del ACL significa PUBLIC tiene EXECUTE). Esto permite que anon
-- pueda ejecutar funciones críticas como clinica_actual(), tiene_rol_en_clinica(), etc.
--
-- Las 13 funciones con PUBLIC ACCESS en producción son:
--   aceptar_invitacion, auditar_cambio, clinica_actual, es_admin_de_clinica_actual,
--   handle_new_user, invitar_miembro, listar_invitaciones_clinica, profiles_lock_role,
--   puede_invitar_miembro, revocar_invitacion, rol_en_clinica_actual,
--   set_clinica_id_on_insert, tiene_rol_en_clinica
--
-- Adicionalmente, 5 funciones tienen anon ACCESS que no necesitan:
--   current_role, has_role, is_admin, registrar_exportacion, role_in
--
-- Se PRESERVA anon en 2 funciones que lo necesitan para el flujo de registro:
--   bootstrap_clinica, verificar_bootstrap_necesario
--
-- Esta migración:
-- 1. REVOKE PUBLIC de las 13 funciones afectadas
-- 2. REVOKE anon de las 5 funciones que no lo necesitan
-- 3. Valida con RAISE EXCEPTION (fail-closed) que:
--    - Ninguna SECURITY DEFINER tiene PUBLIC ACCESS
--    - Ninguna SECURITY DEFINER tiene anon ACCESS no autorizado
--    - Todas las SECURITY DEFINER tienen search_path configurado
--    - 0 INSERT policies en audit_log
--
-- Idempotente: puede ejecutarse múltiples veces sin error.
-- ============================================================

-- ============================================================
-- 1. REVOKE PUBLIC de funciones con PUBLIC ACCESS (13 funciones)
-- ============================================================
REVOKE ALL ON FUNCTION public.aceptar_invitacion(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.auditar_cambio() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.auditar_cambio() FROM anon;
REVOKE ALL ON FUNCTION public.clinica_actual() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.es_admin_de_clinica_actual() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.invitar_miembro(text, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.listar_invitaciones_clinica() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.profiles_lock_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.puede_invitar_miembro() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revocar_invitacion(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rol_en_clinica_actual() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_clinica_id_on_insert() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.tiene_rol_en_clinica(public.app_role[]) FROM PUBLIC;

-- ============================================================
-- 2. REVOKE anon de TODAS las SECURITY DEFINER excepto las permitidas
-- ============================================================
-- Se preservan bootstrap_clinica y verificar_bootstrap_necesario
-- porque son necesarias durante el flujo de registro (antes del login)
--
-- Loop dinámico que cubre TODAS las funciones con anon ACCESS,
-- sin necesidad de hardcodear firmas específicas.
DO $$
DECLARE
  r RECORD;
  allowed_anon_functions TEXT[] := ARRAY['bootstrap_clinica', 'verificar_bootstrap_necesario'];
  revoked_count INTEGER := 0;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, p.proacl::text AS acl
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proacl IS NOT NULL
      AND p.proacl::text LIKE '%anon=X/%'
      AND NOT (p.proname = ANY(allowed_anon_functions))
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', r.oid::regprocedure);
    revoked_count := revoked_count + 1;
    RAISE NOTICE 'F7-37 FINAL: REVOKE anon de función %', r.proname;
  END LOOP;
  
  IF revoked_count > 0 THEN
    RAISE NOTICE 'F7-37 FINAL: ✅ % funciones SECURITY DEFINER con anon ACCESS revocadas', revoked_count;
  ELSE
    RAISE NOTICE 'F7-37 FINAL: ✅ Ninguna función SECURITY DEFINER con anon ACCESS no autorizado';
  END IF;
END;
$$;

-- ============================================================
-- 3. Verificación fail-closed: sin PUBLIC ACCESS
-- ============================================================
DO $$
DECLARE
  r RECORD;
  public_access_count INTEGER := 0;
  total_security_definer INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_security_definer
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prosecdef = true;

  FOR r IN
    SELECT p.proname, p.proacl::text AS acl
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proacl IS NOT NULL
      AND (p.proacl::text LIKE '%,=X/%' OR p.proacl::text LIKE '{=X/%')
  LOOP
    public_access_count := public_access_count + 1;
    RAISE EXCEPTION 'F7-37 FINAL: función % tiene PUBLIC ACCESS (acl: %)', r.proname, r.acl;
  END LOOP;
  
  IF public_access_count > 0 THEN
    RAISE EXCEPTION 'F7-37 FINAL: % funciones SECURITY DEFINER tienen PUBLIC ACCESS', public_access_count;
  ELSE
    RAISE NOTICE 'F7-37 FINAL: ✅ % funciones SECURITY DEFINER sin PUBLIC ACCESS', total_security_definer;
  END IF;
END;
$$;

-- ============================================================
-- 4. Verificación fail-closed: sin anon ACCESS no autorizado
-- ============================================================
-- Funciones que SÍ pueden ser ejecutadas por anon (flujo de registro):
--   bootstrap_clinica, verificar_bootstrap_necesario
-- Todas las demás SECURITY DEFINER NO deben ser ejecutables por anon
DO $$
DECLARE
  r RECORD;
  anon_access_count INTEGER := 0;
  allowed_anon_functions TEXT[] := ARRAY['bootstrap_clinica', 'verificar_bootstrap_necesario'];
BEGIN
  FOR r IN
    SELECT p.proname, p.proacl::text AS acl
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proacl IS NOT NULL
      AND p.proacl::text LIKE '%anon=X/%'
      AND NOT (p.proname = ANY(allowed_anon_functions))
  LOOP
    anon_access_count := anon_access_count + 1;
    RAISE EXCEPTION 'F7-37 FINAL: función % tiene anon ACCESS no autorizado (acl: %)', r.proname, r.acl;
  END LOOP;
  
  IF anon_access_count > 0 THEN
    RAISE EXCEPTION 'F7-37 FINAL: % funciones SECURITY DEFINER tienen anon ACCESS no autorizado', anon_access_count;
  ELSE
    RAISE NOTICE 'F7-37 FINAL: ✅ Sin anon ACCESS no autorizado en SECURITY DEFINER';
  END IF;
END;
$$;

-- ============================================================
-- 5. Verificación fail-closed: search_path vacío
-- ============================================================
DO $$
DECLARE
  r RECORD;
  missing_count INTEGER := 0;
  total_security_definer INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_security_definer
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prosecdef = true;

  FOR r IN
    SELECT p.proname, COALESCE(p.proconfig::text, 'NO CONFIG') AS config
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND (p.proconfig IS NULL OR NOT (p.proconfig::text LIKE '%search_path%'))
  LOOP
    missing_count := missing_count + 1;
    RAISE EXCEPTION 'F7-37 FINAL: función % no tiene search_path (config: %)', r.proname, r.config;
  END LOOP;
  
  IF missing_count > 0 THEN
    RAISE EXCEPTION 'F7-37 FINAL: % funciones SECURITY DEFINER sin search_path', missing_count;
  ELSE
    RAISE NOTICE 'F7-37 FINAL: ✅ Todas las % SECURITY DEFINER tienen search_path', total_security_definer;
  END IF;
END;
$$;

-- ============================================================
-- 6. Verificación fail-closed: 0 INSERT policies en audit_log
-- ============================================================
DO $$
DECLARE
  pol RECORD;
  insert_count INTEGER := 0;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'audit_log'
      AND cmd = 'INSERT'
  LOOP
    insert_count := insert_count + 1;
    RAISE EXCEPTION 'F7-37 FINAL: INSERT policy en audit_log: %', pol.policyname;
  END LOOP;
  
  IF insert_count > 0 THEN
    RAISE EXCEPTION 'F7-37 FINAL: % INSERT policies en audit_log', insert_count;
  ELSE
    RAISE NOTICE 'F7-37 FINAL: ✅ audit_log es estrictamente append-only (0 INSERT policies)';
  END IF;
END;
$$;

-- ============================================================
-- 7. Documentación de permisos (comentario informativo)
-- ============================================================
COMMENT ON TABLE public.audit_log IS
  'F7-37 FINAL: Audit log estrictamente append-only. '
  'Escritura SOLO vía triggers SECURITY DEFINER (auditar_cambio) y funciones SECURITY DEFINER '
  'con BYPASSRLS (registrar_evento_archivo, registrar_evento_purge, registrar_exportacion). '
  'Usuarios authenticated NO pueden INSERT/UPDATE/DELETE directamente. '
  'SELECT own/admin/clínica permitido. PUBLIC ACCESS y anon ACCESS revocados en 000600.';
