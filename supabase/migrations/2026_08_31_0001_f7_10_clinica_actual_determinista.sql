-- ============================================================
-- F7-10: clinica_actual() determinista + es_admin_de_clinica_actual() acotada
--
-- PROBLEMAS RESUELTOS:
-- 1. clinica_actual() usaba LIMIT 1 sin ORDER BY (no determinista)
-- 2. es_admin_de_clinica_actual() no filtraba por clinica_id
--    (escalación cross-tenant: admin en clínica A operaba como admin en B)
-- 3. Sin selector explícito de clínica
--
-- SOLUCIÓN:
-- 1. clinica_actual() lee selector de user_metadata.clinica_id (validado)
--    con fallback determinista (ORDER BY clinica_id)
-- 2. es_admin_de_clinica_actual() acotada a clinica_actual()
-- ============================================================

-- 1. clinica_actual() determinista con selector explícito
CREATE OR REPLACE FUNCTION public.clinica_actual()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- Selector explícito del usuario (validado: debe tener membresía activa)
    (SELECT mc.clinica_id
     FROM public.miembros_clinica mc
     WHERE mc.user_id = auth.uid()
       AND mc.activo
       AND mc.clinica_id = (auth.jwt() -> 'user_metadata' ->> 'clinica_id')::uuid
     LIMIT 1),
    -- Fallback determinista: primera clínica por orden estable
    (SELECT mc.clinica_id
     FROM public.miembros_clinica mc
     WHERE mc.user_id = auth.uid()
       AND mc.activo
     ORDER BY mc.clinica_id
     LIMIT 1)
  );
$$;

COMMENT ON FUNCTION public.clinica_actual() IS
  'F7-10: Retorna la clínica activa. Lee selector de user_metadata.clinica_id '
  '(validado contra membresía activa). Fallback determinista por ORDER BY clinica_id. '
  'NULL si no tiene membresía (fail-safe).';

-- 2. es_admin_de_clinica_actual() ACOTADA a la clínica actual
CREATE OR REPLACE FUNCTION public.es_admin_de_clinica_actual()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.miembros_clinica
    WHERE user_id = auth.uid()
      AND clinica_id = public.clinica_actual()
      AND rol = 'admin'
      AND activo
  );
$$;

COMMENT ON FUNCTION public.es_admin_de_clinica_actual() IS
  'F7-10: Retorna TRUE si el usuario es admin activo de la clínica ACTUAL '
  '(clinica_actual()). Previene escalación cross-tenant.';

-- 3. REVOKE/GRANT de seguridad (preservar configuración existente)
REVOKE ALL ON FUNCTION public.clinica_actual() FROM anon;
GRANT EXECUTE ON FUNCTION public.clinica_actual() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.es_admin_de_clinica_actual() FROM anon;
GRANT EXECUTE ON FUNCTION public.es_admin_de_clinica_actual() TO authenticated, service_role;
