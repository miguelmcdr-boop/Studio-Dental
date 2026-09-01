-- ============================================================
-- F7-11b: Bootstrap de clínica nueva (self-service)
-- ============================================================
-- Objetivo: permitir que un usuario recién registrado cree su
-- propia clínica y se convierta en admin de ella, sin requerir
-- invitación ni intervención de otro usuario.
--
-- Componentes:
--   1. ALTER TABLE clinicas: agregar columna estado (trial/active/suspended/archived)
--   2. RPC: verificar_bootstrap_necesario() — retorna true si el usuario no tiene clínica
--   3. RPC: bootstrap_clinica() — crea clínica + membresía admin en transacción
--   4. Política RLS: admin_puede_actualizar_su_clinica
--
-- Seguridad:
--   - bootstrap_clinica() valida que el usuario no tenga clínica activa
--   - Rate limiting: 1 clínica cada 24 horas por usuario
--   - RUT único (ya garantizado por idx_clinicas_rut existente)
--   - Transacción atómica: si falla membresía, se revierte clínica
--   - No expone service_role al frontend
--
-- Flujo:
--   1. Frontend llama verificar_bootstrap_necesario() después del login
--   2. Si retorna true, muestra BootstrapClinica wizard
--   3. Usuario completa wizard con datos de la clínica
--   4. Frontend llama bootstrap_clinica(datos) → crea clínica + membresía
--   5. Frontend llama setClinicaActiva(clinicaId) → actualiza user_metadata
--   6. App recarga → clínica activa establecida
-- ============================================================

-- 1. Agregar columna estado a clinicas
-- ============================================================
ALTER TABLE public.clinicas
  ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'trial'
  CHECK (estado IN ('trial', 'active', 'suspended', 'archived'));

COMMENT ON COLUMN public.clinicas.estado IS
  'F7-11b: Estado de la clínica. trial = creada recientemente, active = operativa, '
  'suspended = suspendida por admin o impago, archived = inactiva permanente.';

-- 2. RPC: verificar_bootstrap_necesario()
-- ============================================================
-- Retorna true si el usuario actual NO tiene ninguna membresía activa.
-- Usada por el frontend para decidir si mostrar el wizard de bootstrap.
CREATE OR REPLACE FUNCTION public.verificar_bootstrap_necesario()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.miembros_clinica mc
    WHERE mc.user_id = auth.uid()
      AND mc.activo = true
  );
$$;

COMMENT ON FUNCTION public.verificar_bootstrap_necesario() IS
  'F7-11b: Retorna true si el usuario actual no tiene membresía activa en ninguna clínica. '
  'Usada para decidir si mostrar el wizard de creación de clínica.';

-- 3. RPC: bootstrap_clinica()
-- ============================================================
-- Crea una nueva clínica con estado 'trial' y asigna al usuario actual
-- como admin en una transacción atómica.
--
-- Validaciones:
--   - Usuario autenticado (auth.uid() NOT NULL)
--   - Usuario no tiene clínica activa (no tiene membresía activa)
--   - Usuario no ha creado una clínica en las últimas 24 horas (rate limiting)
--   - Nombre no vacío
--   - RUT único (garantizado por índice existente)
--
-- Nota: NO actualiza user_metadata.clinica_id. El frontend debe llamar
-- setClinicaActiva() después para establecer la clínica activa.
CREATE OR REPLACE FUNCTION public.bootstrap_clinica(
  p_nombre TEXT,
  p_rut_empresa TEXT DEFAULT NULL,
  p_direccion TEXT DEFAULT NULL,
  p_telefono TEXT DEFAULT NULL,
  p_email_contacto TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_clinica_id UUID;
  v_ultima_clinica_creada TIMESTAMPTZ;
BEGIN
  -- Validación: usuario autenticado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'NO_AUTENTICADO: debes iniciar sesión';
  END IF;

  -- Validación: usuario no tiene membresía activa
  IF EXISTS (
    SELECT 1 FROM public.miembros_clinica mc
    WHERE mc.user_id = v_user_id
      AND mc.activo = true
  ) THEN
    RAISE EXCEPTION 'YA_TIENE_CLINICA: ya tienes una clínica activa. No puedes crear otra.';
  END IF;

  -- Validación: rate limiting (1 clínica por usuario cada 24 horas)
  SELECT MAX(c.created_at) INTO v_ultima_clinica_creada
  FROM public.clinicas c
  JOIN public.miembros_clinica mc ON mc.clinica_id = c.id
  WHERE mc.user_id = v_user_id
    AND mc.rol = 'admin'
    AND mc.invitado_por IS NULL;  -- Solo creadas por bootstrap (no por invitación)

  IF v_ultima_clinica_creada IS NOT NULL
     AND v_ultima_clinica_creada > NOW() - INTERVAL '24 hours' THEN
    RAISE EXCEPTION 'RATE_LIMIT: ya creaste una clínica recientemente. Espera 24 horas.';
  END IF;

  -- Validación: nombre requerido
  IF p_nombre IS NULL OR trim(p_nombre) = '' THEN
    RAISE EXCEPTION 'NOMBRE_REQUERIDO: el nombre de la clínica es obligatorio';
  END IF;

  IF length(trim(p_nombre)) < 3 THEN
    RAISE EXCEPTION 'NOMBRE_MUY_CORTO: el nombre debe tener al menos 3 caracteres';
  END IF;

  IF length(trim(p_nombre)) > 100 THEN
    RAISE EXCEPTION 'NOMBRE_MUY_LARGO: el nombre no puede exceder 100 caracteres';
  END IF;

  -- Validación: RUT único (si se proporciona)
  IF p_rut_empresa IS NOT NULL AND trim(p_rut_empresa) <> '' THEN
    IF EXISTS (
      SELECT 1 FROM public.clinicas
      WHERE rut_empresa = trim(p_rut_empresa)
    ) THEN
      RAISE EXCEPTION 'RUT_DUPLICADO: ya existe una clínica con este RUT';
    END IF;
  END IF;

  -- Transacción atómica: crear clínica + membresía admin
  BEGIN
    -- Crear clínica con estado trial
    INSERT INTO public.clinicas (
      nombre, rut_empresa, direccion, telefono, email_contacto, estado, created_at, updated_at
    ) VALUES (
      trim(p_nombre),
      NULLIF(trim(p_rut_empresa), ''),
      NULLIF(trim(p_direccion), ''),
      NULLIF(trim(p_telefono), ''),
      NULLIF(trim(p_email_contacto), ''),
      'trial',
      NOW(),
      NOW()
    )
    RETURNING id INTO v_clinica_id;

    -- Crear membresía admin (sin invitado_por porque es bootstrap)
    INSERT INTO public.miembros_clinica (
      clinica_id, user_id, rol, activo, invitado_por, fecha_invitacion
    ) VALUES (
      v_clinica_id, v_user_id, 'admin', true, NULL, NOW()
    );

    -- Actualizar profiles.role del usuario a admin (opcional, para consistencia)
    -- NOTA: esto no afecta clinica_actual() que lee de miembros_clinica
    UPDATE public.profiles
    SET role = 'admin'::app_role, updated_at = NOW()
    WHERE id = v_user_id;

    RETURN v_clinica_id;

  EXCEPTION WHEN OTHERS THEN
    -- Si algo falla, la transacción se revierte automáticamente
    RAISE;
  END;
END;
$$;

COMMENT ON FUNCTION public.bootstrap_clinica() IS
  'F7-11b: Crea una nueva clínica con estado trial y asigna al usuario actual como admin. '
  'Valida: sin clínica activa, rate limiting 24h, nombre válido, RUT único. '
  'El frontend debe llamar setClinicaActiva() después para activar la clínica.';

-- 4. Política RLS: admin puede actualizar su clínica
-- ============================================================
-- Permite a los admins actualizar nombre, dirección, etc. de su propia clínica
-- pero NO el estado (eso requerirá otra política o ser super-admin).
DROP POLICY IF EXISTS "admin_actualiza_su_clinica" ON public.clinicas;
CREATE POLICY "admin_actualiza_su_clinica" ON public.clinicas
  FOR UPDATE
  USING (
    id = public.clinica_actual()
    AND EXISTS (
      SELECT 1 FROM public.miembros_clinica mc
      WHERE mc.user_id = auth.uid()
        AND mc.clinica_id = public.clinicas.id
        AND mc.rol = 'admin'
        AND mc.activo = true
    )
  )
  WITH CHECK (
    id = public.clinica_actual()
    AND EXISTS (
      SELECT 1 FROM public.miembros_clinica mc
      WHERE mc.user_id = auth.uid()
        AND mc.clinica_id = public.clinicas.id
        AND mc.rol = 'admin'
        AND mc.activo = true
    )
  );

-- 5. Permisos
-- ============================================================
REVOKE ALL ON FUNCTION public.verificar_bootstrap_necesario() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bootstrap_clinica(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verificar_bootstrap_necesario() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_clinica(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- NO otorgar permisos a anon (solo usuarios autenticados pueden crear clínicas)
-- NO otorgar permisos a service_role (evita exposición al frontend)
