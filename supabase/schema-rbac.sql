-- ============================================================
-- Studio Dental — Esquema RBAC server-side (F6-B1)
-- Rol a app_metadata + helpers SQL + trigger de alta de perfil
--
-- Dependencias: debe ejecutarse DESPUÉS de schema.sql
--               (que crea la tabla profiles y update_updated_at_column)
-- ============================================================

-- ============================================================
-- 1. ENUM app_role — fuente de verdad server-side del rol
--    Espejo de src/constants/rbacConstants.js ROLES
-- ============================================================
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'dentista', 'asistente', 'recepcion');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. current_role() — lee el rol desde el JWT firmado
--    SECURITY DEFINER: se ejecuta con privilegios del owner (postgres)
--    para poder leer auth.jwt() desde cualquier contexto
-- ============================================================
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'admin'     THEN 'admin'::app_role
      WHEN (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'dentista'  THEN 'dentista'::app_role
      WHEN (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'asistente' THEN 'asistente'::app_role
      WHEN (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'recepcion' THEN 'recepcion'::app_role
      ELSE NULL::app_role
    END;
$$;

COMMENT ON FUNCTION public.current_role() IS
  'Retorna el rol del usuario autenticado leyendo auth.jwt() -> app_metadata -> role. '
  'Retorna NULL si el usuario no está autenticado o si el rol es inválido.';

-- ============================================================
-- 3. has_role(app_role) — verificación de rol
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_role() = _role;
$$;

COMMENT ON FUNCTION public.has_role(app_role) IS
  'Retorna TRUE si el usuario autenticado tiene el rol especificado.';

-- ============================================================
-- 4. is_admin() — azúcar sintáctica
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_role() = 'admin'::app_role;
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'Retorna TRUE si el usuario autenticado es admin.';

-- ============================================================
-- 5. set_app_metadata_role — escribe el rol en app_metadata
--    SECURITY DEFINER: necesaria porque PostgREST no expone
--    auth.update_user_metadata() a funciones SQL de usuario.
--    Accesible desde triggers internos y service_role.
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_app_metadata_role(
  _user_id uuid,
  _role app_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
                         || jsonb_build_object('role', _role::text)
  WHERE id = _user_id;
END;
$$;

COMMENT ON FUNCTION public.set_app_metadata_role(uuid, app_role) IS
  'Escribe el rol en auth.users.raw_app_meta_data. Accesible por triggers internos y service_role.';

-- ============================================================
-- 6. Trigger: on_auth_user_created
--    AFTER INSERT en auth.users:
--      - Valida rol desde raw_user_meta_data
--      - Crea fila en public.profiles (idempotente)
--      - Propaga el rol a app_metadata
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _raw_role text;
  _role app_role;
BEGIN
  -- Leer rol desde metadata del signup (si viene)
  _raw_role := NEW.raw_user_meta_data ->> 'role';

  -- Validar contra enum; default a recepcion si inválido o ausente
  IF _raw_role IS NULL OR _raw_role NOT IN ('admin', 'dentista', 'asistente', 'recepcion') THEN
    _role := 'recepcion'::app_role;
  ELSE
    _role := _raw_role::app_role;
  END IF;

  -- Crear perfil (idempotente por si existe vía seed manual)
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    _role::text,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
        role = EXCLUDED.role,
        updated_at = NOW();

  -- Propagar el rol a app_metadata (donde el JWT lo leerá)
  PERFORM public.set_app_metadata_role(NEW.id, _role);

  RETURN NEW;
END;
$$;

-- Registrar el trigger (idempotente)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
  'Trigger AFTER INSERT en auth.users: crea fila en profiles y propaga rol a app_metadata.';

-- ============================================================
-- 7. get_role_from_metadata(uuid) — helper para queries admin
--    Lee el rol directamente desde auth.users dado un user_id
--    (útil para paneles administrativos que listan usuarios)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_role_from_metadata(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN (raw_app_meta_data ->> 'role') = 'admin'     THEN 'admin'::app_role
      WHEN (raw_app_meta_data ->> 'role') = 'dentista'   THEN 'dentista'::app_role
      WHEN (raw_app_meta_data ->> 'role') = 'asistente'  THEN 'asistente'::app_role
      WHEN (raw_app_meta_data ->> 'role') = 'recepcion'  THEN 'recepcion'::app_role
      ELSE NULL::app_role
    END
  FROM auth.users
  WHERE id = _user_id;
$$;

COMMENT ON FUNCTION public.get_role_from_metadata(uuid) IS
  'Retorna el rol de un usuario específico leyendo auth.users.raw_app_meta_data.';

-- ============================================================
-- VERIFICACIÓN: ejecutar este bloque valida que todo quedó bien
-- ============================================================
-- SELECT 'enum app_role existe' AS check,
--        EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') AS ok
-- UNION ALL
-- SELECT 'current_role() existe',
--        EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_role' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
-- UNION ALL
-- SELECT 'has_role() existe',
--        EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role')
-- UNION ALL
-- SELECT 'is_admin() existe',
--        EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin')
-- UNION ALL
-- SELECT 'set_app_metadata_role() existe',
--        EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_app_metadata_role')
-- UNION ALL
-- SELECT 'handle_new_user() existe',
--        EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')
-- UNION ALL
-- SELECT 'trigger on_auth_user_created existe',
--        EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')
-- UNION ALL
-- SELECT 'get_role_from_metadata() existe',
--        EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_role_from_metadata');
