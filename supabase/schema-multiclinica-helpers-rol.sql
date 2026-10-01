-- ============================================================
-- F6-C-c.1: Funciones helper de rol por clínica
-- ============================================================
-- Alcance:
-- 1. rol_en_clinica_actual(): retorna el rol del usuario en su clínica
-- 2. tiene_rol_en_clinica(): verifica si el rol está en una lista
-- Ambas SECURITY DEFINER (evitan recursión de RLS: miembros_clinica tiene RLS)
-- Ambas STABLE (PostgreSQL cachea el resultado por sentencia)
-- Reemplazan a role_in() de F6-B, que leía de app_metadata.
-- Ahora el rol autoritativo es miembros_clinica.rol (RFC §4.6).
-- ============================================================

-- 1. Función rol_en_clinica_actual()
DROP FUNCTION IF EXISTS public.rol_en_clinica_actual() CASCADE;

CREATE OR REPLACE FUNCTION public.rol_en_clinica_actual()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rol::app_role
  FROM public.miembros_clinica
  WHERE user_id = (select auth.uid())
    AND clinica_id = public.clinica_actual()
    AND activo
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.rol_en_clinica_actual() IS
  'Retorna el rol (app_role) del usuario actual en su clínica actual. NULL si no tiene membresía activa. SECURITY DEFINER evita recursión de RLS.';

-- 2. Función tiene_rol_en_clinica(_roles app_role[])
DROP FUNCTION IF EXISTS public.tiene_rol_en_clinica(app_role[]) CASCADE;

CREATE OR REPLACE FUNCTION public.tiene_rol_en_clinica(_roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.rol_en_clinica_actual() = ANY(_roles);
$$;

COMMENT ON FUNCTION public.tiene_rol_en_clinica(app_role[]) IS
  'TRUE si el rol del usuario en su clínica actual está en la lista. Base de las políticas F6-C. SECURITY DEFINER.';

-- 3. GRANTs
REVOKE ALL ON FUNCTION public.rol_en_clinica_actual() FROM anon;
GRANT EXECUTE ON FUNCTION public.rol_en_clinica_actual() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.tiene_rol_en_clinica(app_role[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.tiene_rol_en_clinica(app_role[]) TO authenticated, service_role;
