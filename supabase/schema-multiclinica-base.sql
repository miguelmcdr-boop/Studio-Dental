-- ============================================================
-- F6-C-a: Modelo multi-clínica — tablas base + helpers
-- ============================================================
-- Alcance:
-- 1. Tabla clinicas (datos de la clínica)
-- 2. Tabla miembros_clinica (membresías usuario-clínica con rol)
-- 3. Función clinica_actual() (STABLE + SECURITY DEFINER)
-- 4. Función es_admin_de_clinica_actual() (evita recursión en políticas)
-- 5. RLS en ambas tablas
-- 6. GRANTs
-- ============================================================

-- 1. Tabla clinicas
DROP TABLE IF EXISTS public.clinicas CASCADE;

CREATE TABLE public.clinicas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  rut_empresa TEXT,
  direccion TEXT,
  telefono TEXT,
  email_contacto TEXT,
  logo_url TEXT,
  color_primario TEXT DEFAULT '#3B82F6',
  color_secundario TEXT DEFAULT '#10B981',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_clinicas_rut
  ON public.clinicas(rut_empresa) WHERE rut_empresa IS NOT NULL;

ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;

-- 2. Tabla miembros_clinica
DROP TABLE IF EXISTS public.miembros_clinica CASCADE;

CREATE TABLE public.miembros_clinica (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'dentista', 'asistente', 'recepcion')),
  activo BOOLEAN NOT NULL DEFAULT true,
  invitado_por UUID REFERENCES auth.users(id),
  fecha_invitacion TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (clinica_id, user_id)
);

CREATE INDEX idx_miembros_usuario
  ON public.miembros_clinica(user_id, activo, clinica_id);
CREATE INDEX idx_miembros_clinica
  ON public.miembros_clinica(clinica_id, activo);

ALTER TABLE public.miembros_clinica ENABLE ROW LEVEL SECURITY;

-- 3. Función clinica_actual()
-- STABLE: PostgreSQL puede cachear el resultado dentro de una misma sentencia.
-- SECURITY DEFINER: se ejecuta como el owner y evita recursión de RLS.
DROP FUNCTION IF EXISTS public.clinica_actual() CASCADE;

CREATE OR REPLACE FUNCTION public.clinica_actual()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT clinica_id
  FROM public.miembros_clinica
  WHERE user_id = (select auth.uid())
    AND activo
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.clinica_actual() IS
  'Retorna el clinica_id de la membresía activa del usuario actual. NULL si no tiene membresía (fail-safe).';

-- 4. Función es_admin_de_clinica_actual()
-- Evita recursión de RLS en políticas de gestión de miembros.
DROP FUNCTION IF EXISTS public.es_admin_de_clinica_actual() CASCADE;

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
    WHERE user_id = (select auth.uid())
      AND rol = 'admin'
      AND activo
  );
$$;

COMMENT ON FUNCTION public.es_admin_de_clinica_actual() IS
  'Retorna TRUE si el usuario actual es admin activo de su clínica. Usa SECURITY DEFINER para evitar recursión.';

-- 5. Políticas RLS en clinicas
-- Lectura: cualquier miembro activo de la clínica
CREATE POLICY "miembros_leen_su_clinica" ON public.clinicas
  FOR SELECT
  USING (id = public.clinica_actual());

-- Escritura: SOLO admin de la clínica (Decisión de producto #2 del RFC)
CREATE POLICY "admin_actualiza_su_clinica" ON public.clinicas
  FOR UPDATE
  USING (
    id = public.clinica_actual()
    AND public.es_admin_de_clinica_actual()
  )
  WITH CHECK (id = public.clinica_actual());

-- 6. Políticas RLS en miembros_clinica
-- Leer membresías de mi(s) clínica(s)
CREATE POLICY "miembros_leen_membresias" ON public.miembros_clinica
  FOR SELECT
  USING (clinica_id = public.clinica_actual());

-- Gestionar miembros: SOLO admin de la clínica (usa la función para evitar recursión)
CREATE POLICY "admin_gestiona_miembros" ON public.miembros_clinica
  FOR ALL
  USING (
    clinica_id = public.clinica_actual()
    AND public.es_admin_de_clinica_actual()
  )
  WITH CHECK (
    clinica_id = public.clinica_actual()
    AND public.es_admin_de_clinica_actual()
  );

-- 7. GRANTs
GRANT ALL ON public.clinicas TO authenticated, service_role;
GRANT ALL ON public.miembros_clinica TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.clinica_actual() FROM anon;
GRANT EXECUTE ON FUNCTION public.clinica_actual() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.es_admin_de_clinica_actual() FROM anon;
GRANT EXECUTE ON FUNCTION public.es_admin_de_clinica_actual() TO authenticated, service_role;

-- ============================================================
-- Fin F6-C-a
-- ============================================================
