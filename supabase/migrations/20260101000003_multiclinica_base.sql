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
-- ============================================================
-- F6-C-c.2: Agregar clinica_id a las 18 tablas + backfill + índices
-- ============================================================
-- Patrón RFC §4.4: ADD COLUMN nullable -> backfill -> SET NOT NULL -> INDEX
-- Backfill con la clínica inicial (00000000-...-000000000001, creada en F6-C-b)
-- NO toca las políticas RLS (eso es C-c.3)
-- Idempotente y atómico (el DO block se revierte si algo falla)
-- ============================================================

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'pacientes','citas','prestaciones','presupuestos','presupuesto_items','pagos',
    'movimientos_financieros','inventario','evoluciones_clinicas','recetas',
    'odontogramas','periodontogramas','periodontogramas_historial','dsd_configs',
    'odontopediatria','quirurgico_implantes','quirurgico_endodoncia','audit_log'
  ]
  LOOP
    -- 1. Agregar columna nullable (idempotente)
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS clinica_id UUID REFERENCES public.clinicas(id)',
      t);

    -- 2. Backfill con la clínica inicial (solo filas sin clinica_id)
    EXECUTE format(
      'UPDATE public.%I SET clinica_id = %L WHERE clinica_id IS NULL',
      t, '00000000-0000-0000-0000-000000000001'::uuid);

    -- 3. SET NOT NULL (seguro porque el backfill cubrió todas las filas)
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN clinica_id SET NOT NULL',
      t);

    -- 4. Índice en clinica_id
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I(clinica_id)',
      'idx_' || t || '_clinica', t);

    RAISE NOTICE 'Tabla % : clinica_id agregado + backfill + NOT NULL + índice', t;
  END LOOP;
END;
$$;
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
-- ============================================================
-- F6-C-d.1: Trigger para auto-setear clinica_id en INSERT
-- ============================================================
-- Resuelve el NOT NULL de clinica_id sin modificar los 18 *StorageService
-- del frontend. El trigger setea clinica_id = clinica_actual() si viene NULL.
-- Si clinica_actual() retorna NULL (usuario sin membresía), hace RAISE EXCEPTION.
-- Idempotente: seguro re-ejecutar.
-- ============================================================

-- Función del trigger
CREATE OR REPLACE FUNCTION public.set_clinica_id_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinica UUID;
BEGIN
  -- Si clinica_id ya viene seteado, no hacer nada
  IF NEW.clinica_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Obtener clínica actual del usuario
  v_clinica := public.clinica_actual();
  
  IF v_clinica IS NULL THEN
    RAISE EXCEPTION 'Usuario % no tiene membresía activa en ninguna clínica', auth.uid();
  END IF;

  NEW.clinica_id := v_clinica;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_clinica_id_on_insert() IS
  'BEFORE INSERT: setea clinica_id = clinica_actual() si viene NULL. RAISE EXCEPTION si no hay membresía activa.';

-- Aplicar trigger a las 18 tablas
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'pacientes','citas','prestaciones','presupuestos','presupuesto_items','pagos',
    'movimientos_financieros','inventario','evoluciones_clinicas','recetas',
    'odontogramas','periodontogramas','periodontogramas_historial','dsd_configs',
    'odontopediatria','quirurgico_implantes','quirurgico_endodoncia','audit_log'
  ]
  LOOP
    -- Eliminar trigger si existe (idempotente)
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'trigger_set_clinica_id_' || t, t);
    
    -- Crear trigger BEFORE INSERT
    EXECUTE format(
      'CREATE TRIGGER %I
         BEFORE INSERT ON public.%I
         FOR EACH ROW
         EXECUTE FUNCTION public.set_clinica_id_on_insert()',
      'trigger_set_clinica_id_' || t, t);
    
    RAISE NOTICE 'Trigger creado en tabla %', t;
  END LOOP;
END;
$$;

-- GRANTs
REVOKE ALL ON FUNCTION public.set_clinica_id_on_insert() FROM anon;
GRANT EXECUTE ON FUNCTION public.set_clinica_id_on_insert() TO authenticated, service_role;
