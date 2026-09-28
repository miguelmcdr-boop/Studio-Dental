-- ============================================================
-- F7-35: clinica_actual() fail-closed (sin fallback silencioso)
-- ============================================================
--
-- PROBLEMA RESUELTO (hallazgo F7-35):
-- La versión F7-10 de clinica_actual() tenía un fallback determinista:
--   COALESCE(selector_validado, primera_membresia_por_orden)
-- Esto causaba comportamiento divergente entre RLS (que aceptaba el
-- fallback) y Edge Functions F7-34b (que rechazaban con 403 cuando
-- metadata estaba ausente/inválida).
--
-- Adicionalmente, el cast `::uuid` sin guard podía romper queries RLS
-- si metadata contenía un valor no-UUID.
--
-- SOLUCIÓN:
-- clinica_actual() solo retorna el selector validado (metadata + membresía
-- activa). Sin fallback silencioso. Sin error de cast.
--
-- Comportamiento post-F7-35:
--   metadata ausente      → NULL (fail-closed)
--   metadata no-UUID      → NULL (fail-closed, sin error)
--   metadata inválida     → NULL (fail-closed, sin error)
--   membresía inactiva    → NULL (fail-closed)
--   clínica no-miembro    → NULL (fail-closed)
--   selector válido       → clinica_id
--
-- MITIGACIÓN: migración 2026_09_24_0002 hace backfill de metadata para
-- usuarios existentes sin selector, para que nadie quede bloqueado.
--
-- es_admin_de_clinica_actual() NO requiere cambio: ya está acotada a
-- clinica_actual() por F7-10. Hereda fail-closed automáticamente.
-- ============================================================

-- 1. clinica_actual() fail-closed + regex-guard UUID
CREATE OR REPLACE FUNCTION public.clinica_actual()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    SELECT mc.clinica_id
    FROM public.miembros_clinica mc
    WHERE mc.user_id = auth.uid()
      AND mc.activo
      AND mc.clinica_id = (
        -- Regex-guard: solo cast a UUID si el formato es válido.
        -- Si metadata ausente o no-UUID → NULL, sin error.
        CASE
          WHEN (auth.jwt() -> 'user_metadata' ->> 'clinica_id')
               ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
          THEN (auth.jwt() -> 'user_metadata' ->> 'clinica_id')::uuid
        END
      )
    LIMIT 1
  );
$$;

COMMENT ON FUNCTION public.clinica_actual() IS
  'F7-35 (fail-closed): Retorna la clínica activa leyendo user_metadata.clinica_id '
  'del JWT, validado contra membresía activa. SIN fallback silencioso. '
  'Regex-guard para cast UUID seguro. NULL si selector ausente/inválido/no-miembro/inactivo. '
  'Las 80+ políticas RLS heredan fail-closed automáticamente.';

-- 2. Preservar permisos
REVOKE ALL ON FUNCTION public.clinica_actual() FROM anon;
GRANT EXECUTE ON FUNCTION public.clinica_actual() TO authenticated, service_role;

-- 3. Verificación post-migración (informativo, no bloqueante)
-- Ejecutar en SQL Editor para confirmar:
--   SELECT public.clinica_actual();  -- debe retornar la clínica del selector o NULL
