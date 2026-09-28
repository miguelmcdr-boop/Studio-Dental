-- ============================================================
-- F7-36 FASE 3: SECURITY DEFINER hardening de helpers RBAC
-- ============================================================
--
-- OBJETIVO:
-- 1. Endurecer search_path de las 8 funciones RBAC
--    (SET search_path = '' en lugar de = public)
-- 2. Restringir permisos de funciones que NO deben ser invocables
--    por usuarios autenticados normales
--
-- PRINCIPIO CONSERVADOR (del brief):
-- - NO se elimina ninguna función (is_admin preservada aunque dead code)
-- - NO se toca la lógica interna de las funciones
-- - Solo cambian: search_path y permisos
-- - Todas las referencias ya están calificadas -> compatible con search_path=''
--
-- REGLAS APLICADAS (del brief F7-36 FASE 3):
-- - Preferir SECURITY DEFINER SET search_path = '' cuando compatible
-- - Usar referencias completamente calificadas (public.tabla, auth.*)
-- - NO modificar funciones legítimas innecesariamente
--
-- VECTOR CRÍTICO CERRADO:
-- set_app_metadata_role() podía ser invocada por cualquier usuario
-- autenticado para escalar privilegios (cambiar role de cualquier
-- usuario en auth.users). Ahora solo service_role y triggers pueden
-- invocarla.
--
-- TEST OBLIGATORIO (post-aplicacion):
-- SET ROLE authenticated;
-- SELECT public.set_app_metadata_role(
--   '00000000-0000-0000-0000-000000000000'::uuid, 'admin'::public.app_role
-- );
-- -- Esperado: ERROR 'permission denied for function set_app_metadata_role'
-- RESET ROLE;
-- ============================================================

-- ============================================================
-- 1. current_role() - endurecer search_path
-- ============================================================
-- Caller: RLS policies (authenticated) -> requiere GRANT TO authenticated
-- NO se puede revocar sin romper RLS
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    CASE
      WHEN (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin'     THEN 'admin'::public.app_role
      WHEN (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'dentista'  THEN 'dentista'::public.app_role
      WHEN (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'asistente' THEN 'asistente'::public.app_role
      WHEN (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'recepcion' THEN 'recepcion'::public.app_role
      ELSE NULL::public.app_role
    END;
$$;

REVOKE ALL ON FUNCTION public.current_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_role() TO authenticated, service_role;

COMMENT ON FUNCTION public.current_role() IS
  'F7-36 FASE 3: Lee el rol desde auth.jwt() -> app_metadata -> role. '
  'SECURITY DEFINER con search_path vacio. '
  'Permisos: authenticated (necesario para RLS) + service_role.';

-- ============================================================
-- 2. has_role(app_role) - endurecer search_path
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.current_role() = _role;
$$;

REVOKE ALL ON FUNCTION public.has_role(public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO authenticated, service_role;

COMMENT ON FUNCTION public.has_role(public.app_role) IS
  'F7-36 FASE 3: TRUE si el usuario autenticado tiene el rol. search_path vacio.';

-- ============================================================
-- 3. is_admin() - endurecer search_path (dead code preservado)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.current_role() = 'admin'::public.app_role;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

COMMENT ON FUNCTION public.is_admin() IS
  'F7-36 FASE 3: TRUE si el usuario es admin. search_path vacio. '
  'Nota: no se usa en codigo actualmente (dead code preservado por principio conservador).';

-- ============================================================
-- 4. role_in(app_role[]) - endurecer search_path
-- ============================================================
CREATE OR REPLACE FUNCTION public.role_in(_roles public.app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.current_role() = ANY(_roles);
$$;

REVOKE ALL ON FUNCTION public.role_in(public.app_role[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.role_in(public.app_role[]) TO authenticated, service_role;

COMMENT ON FUNCTION public.role_in(public.app_role[]) IS
  'F7-36 FASE 3: TRUE si el rol del JWT esta en la lista. Base de las policies. '
  'search_path vacio.';

-- ============================================================
-- 5. set_app_metadata_role - RESTRINGIR (riesgo de escalada)
-- ============================================================
-- Caller: SOLO trigger handle_new_user (como postgres) y service_role.
-- Usuario autenticado NO debe poder invocarla (riesgo de escalada).
CREATE OR REPLACE FUNCTION public.set_app_metadata_role(
  _user_id uuid,
  _role public.app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
                         || jsonb_build_object('role', _role::text)
  WHERE id = _user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_app_metadata_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_app_metadata_role(uuid, public.app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.set_app_metadata_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_app_metadata_role(uuid, public.app_role) TO service_role;

COMMENT ON FUNCTION public.set_app_metadata_role(uuid, public.app_role) IS
  'F7-36 FASE 3: Escribe el rol en auth.users.raw_app_meta_data. '
  'SECURITY DEFINER con search_path vacio. '
  'Permisos: SOLO service_role y triggers internos (postgres). '
  'Usuario autenticado NO puede invocar (previene escalada de privilegios).';

-- ============================================================
-- 6. get_role_from_metadata - RESTRINGIR (solo service_role)
-- ============================================================
-- Caller: queries admin. Usuario normal NO debe leer roles ajenos.
CREATE OR REPLACE FUNCTION public.get_role_from_metadata(_user_id uuid)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    CASE
      WHEN (raw_app_meta_data ->> 'role') = 'admin'     THEN 'admin'::public.app_role
      WHEN (raw_app_meta_data ->> 'role') = 'dentista'   THEN 'dentista'::public.app_role
      WHEN (raw_app_meta_data ->> 'role') = 'asistente'  THEN 'asistente'::public.app_role
      WHEN (raw_app_meta_data ->> 'role') = 'recepcion'  THEN 'recepcion'::public.app_role
      ELSE NULL::public.app_role
    END
  FROM auth.users
  WHERE id = _user_id;
$$;

REVOKE ALL ON FUNCTION public.get_role_from_metadata(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_role_from_metadata(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_role_from_metadata(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_role_from_metadata(uuid) TO service_role;

COMMENT ON FUNCTION public.get_role_from_metadata(uuid) IS
  'F7-36 FASE 3: Retorna el rol de un user_id especifico. search_path vacio. '
  'Permisos: SOLO service_role. Usuario autenticado no puede leer roles ajenos.';

-- ============================================================
-- 7. handle_new_user - endurecer search_path (trigger)
-- ============================================================
-- Caller: trigger on_auth_user_created (invocada por PostgreSQL como owner).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _raw_role text;
  _role public.app_role;
BEGIN
  _raw_role := NEW.raw_user_meta_data ->> 'role';

  IF _raw_role IS NULL OR _raw_role NOT IN ('admin', 'dentista', 'asistente', 'recepcion') THEN
    _role := 'recepcion'::public.app_role;
  ELSE
    _role := _raw_role::public.app_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    _role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
        role = EXCLUDED.role,
        updated_at = NOW();

  PERFORM public.set_app_metadata_role(NEW.id, _role);

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'F7-36 FASE 3: Trigger AFTER INSERT en auth.users. search_path vacio. '
  'Invocada solo por PostgreSQL como owner postgres (trigger).';

-- ============================================================
-- 8. profiles_lock_role - endurecer search_path (trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION public.profiles_lock_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.profiles_lock_role() IS
  'F7-36 FASE 3: Bloquea edicion directa de profiles.role. search_path vacio. '
  'Invocada solo por trigger lock_profiles_role.';

-- ============================================================
-- VERIFICACION POST-APLICACION
-- ============================================================
--
-- Query 1: Confirmar search_path vacio y permisos correctos
--
SELECT p.proname,
       p.proconfig AS config,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_can_exec,
       has_function_privilege('public', p.oid, 'EXECUTE') AS public_can_exec,
       has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_can_exec
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'current_role', 'has_role', 'is_admin', 'role_in',
    'set_app_metadata_role', 'get_role_from_metadata',
    'handle_new_user', 'profiles_lock_role'
  )
ORDER BY p.proname;
--
-- RESULTADO ESPERADO (8 filas):
--
-- current_role            | {search_path=}  | true  | false | true
-- get_role_from_metadata  | {search_path=}  | false | false | true
-- handle_new_user         | {search_path=}  | true  | false | true
-- has_role                | {search_path=}  | true  | false | true
-- is_admin                | {search_path=}  | true  | false | true
-- profiles_lock_role      | {search_path=}  | true  | false | true
-- role_in                 | {search_path=}  | true  | false | true
-- set_app_metadata_role   | {search_path=}  | false | false | true
--
-- Notas:
-- - config = {search_path=} significa search_path vacio (correcto)
-- - Triggers (handle_new_user, profiles_lock_role) tienen auth=true pero
--   es inocuo: solo el trigger las invoca como owner postgres
-- - set_app_metadata_role y get_role_from_metadata tienen auth=false
--   (CRITICO: previene escalada de privilegios)
--
-- Query 2: Test obligatorio (usuario NO puede escalar privilegios)
--
SET ROLE authenticated;
SELECT public.set_app_metadata_role(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'admin'::public.app_role
);
-- Esperado: ERROR 'permission denied for function set_app_metadata_role'
RESET ROLE;
--
-- Query 3: Validar RLS sigue funcionando (login como usuario autenticado)
--
-- SELECT public.current_role();
-- Esperado: retorna el rol del usuario actual (no NULL si esta autenticado)
