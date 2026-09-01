-- ============================================================
-- F7-11: Invitaciones de miembros sin service_role en frontend
-- ============================================================
-- Objetivo: permitir que admins inviten personal a su clínica
-- mediante un flujo seguro de invitación con token, sin exponer
-- service_role al frontend.
--
-- Componentes:
--   1. Tabla: invitaciones_clinica
--   2. RPC: invitar_miembro() — solo admin de clínica activa
--   3. RPC: aceptar_invitacion() — invitado acepta con token
--   4. RPC: revocar_invitacion() — admin revoca invitación
--   5. Trigger: crea membresía automáticamente al aceptar
--   6. RLS: aislamiento por clínica activa
-- ============================================================

-- 1. Extensión pgcrypto para gen_random_uuid (si no existe)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Tabla: invitaciones_clinica
-- ============================================================
DROP TABLE IF EXISTS public.invitaciones_clinica CASCADE;

CREATE TABLE public.invitaciones_clinica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  rol public.app_role NOT NULL,
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  invitado_por UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  creada_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expira_en TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  aceptada_en TIMESTAMPTZ,
  aceptada_por UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX idx_invitaciones_clinica 
  ON public.invitaciones_clinica(clinica_id, status);
CREATE INDEX idx_invitaciones_token 
  ON public.invitaciones_clinica(token);
CREATE INDEX idx_invitaciones_email 
  ON public.invitaciones_clinica(lower(email), status);

-- Índice UNIQUE parcial: prevenir invitaciones duplicadas pendientes
-- para el mismo email en la misma clínica (sin necesidad de btree_gist)
CREATE UNIQUE INDEX idx_invitacion_unica_pendiente
  ON public.invitaciones_clinica(clinica_id, lower(email))
  WHERE status = 'pending';

-- RLS habilitado
ALTER TABLE public.invitaciones_clinica ENABLE ROW LEVEL SECURITY;

-- 3. Función helper: puede_invitar_miembro()
-- ============================================================
-- SECURITY DEFINER: evita recursión RLS al consultar miembros_clinica
-- Retorna TRUE solo si el usuario autenticado es admin de la clínica activa
CREATE OR REPLACE FUNCTION public.puede_invitar_miembro()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.miembros_clinica mc
    WHERE mc.user_id = auth.uid()
      AND mc.clinica_id = public.clinica_actual()
      AND mc.rol::text = 'admin'
      AND mc.activo = true
  );
END;
$$;

COMMENT ON FUNCTION public.puede_invitar_miembro() IS
  'F7-11: Verifica si el usuario actual puede invitar miembros (debe ser admin de clínica activa)';

GRANT EXECUTE ON FUNCTION public.puede_invitar_miembro() TO authenticated;

-- 4. RPC: invitar_miembro()
-- ============================================================
-- Solo admin de clínica activa puede invitar.
-- Genera token único y crea registro pendiente.
CREATE OR REPLACE FUNCTION public.invitar_miembro(
  p_email TEXT,
  p_rol public.app_role
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinica_id UUID;
  v_token TEXT;
  v_invitacion_id UUID;
  v_email_normalizado TEXT;
BEGIN
  -- Validaciones de entrada
  IF p_email IS NULL OR trim(p_email) = '' THEN
    RAISE EXCEPTION 'Email requerido';
  END IF;
  
  IF p_rol IS NULL THEN
    RAISE EXCEPTION 'Rol requerido';
  END IF;
  
  -- Validar rol válido (ya limitado por app_role, pero doble check)
  IF p_rol NOT IN ('admin', 'dentista', 'asistente', 'recepcion') THEN
    RAISE EXCEPTION 'Rol inválido: %', p_rol;
  END IF;
  
  -- Verificar que el usuario actual sea admin de la clínica activa
  IF NOT public.puede_invitar_miembro() THEN
    RAISE EXCEPTION 'PERMISO_DENEGADO: solo administradores pueden invitar miembros';
  END IF;
  
  v_clinica_id := public.clinica_actual();
  
  IF v_clinica_id IS NULL THEN
    RAISE EXCEPTION 'No hay clínica activa seleccionada';
  END IF;
  
  v_email_normalizado := lower(trim(p_email));
  
  -- Verificar que el email no sea ya miembro activo
  IF EXISTS (
    SELECT 1 FROM public.miembros_clinica mc
    JOIN auth.users u ON u.id = mc.user_id
    WHERE mc.clinica_id = v_clinica_id
      AND lower(u.email) = v_email_normalizado
      AND mc.activo = true
  ) THEN
    RAISE EXCEPTION 'Este email ya es miembro activo de la clínica';
  END IF;
  
  -- Generar token único seguro (sin pgcrypto)
  -- Usa combinación de random() + clock_timestamp() + md5 para generar 64 chars hex
  v_token := substr(
    md5(random()::text || clock_timestamp()::text) ||
    md5(random()::text || clock_timestamp()::text),
    1, 64
  );
  
  -- Insertar invitación
  INSERT INTO public.invitaciones_clinica (
    clinica_id, email, rol, token, status, invitado_por
  ) VALUES (
    v_clinica_id, v_email_normalizado, p_rol, v_token, 'pending', auth.uid()
  )
  RETURNING id INTO v_invitacion_id;
  
  RETURN v_invitacion_id;
END;
$$;

COMMENT ON FUNCTION public.invitar_miembro(TEXT, public.app_role) IS
  'F7-11: Crea invitación pendiente. Solo admin de clínica activa. Retorna ID de invitación.';

GRANT EXECUTE ON FUNCTION public.invitar_miembro(TEXT, public.app_role) TO authenticated;

-- 5. RPC: aceptar_invitacion()
-- ============================================================
-- El invitado acepta con el token recibido.
-- Valida: token existe, está pendiente, no expirado, y el usuario autenticado
-- tiene el email de la invitación.
CREATE OR REPLACE FUNCTION public.aceptar_invitacion(
  p_token TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitacion public.invitaciones_clinica%ROWTYPE;
  v_user_email TEXT;
  v_user_id UUID;
BEGIN
  -- Validaciones de entrada
  IF p_token IS NULL OR trim(p_token) = '' THEN
    RAISE EXCEPTION 'Token requerido';
  END IF;
  
  -- Buscar invitación
  SELECT * INTO v_invitacion
  FROM public.invitaciones_clinica
  WHERE token = p_token;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVITACION_NO_ENCONTRADA';
  END IF;
  
  -- Validar estado
  IF v_invitacion.status <> 'pending' THEN
    RAISE EXCEPTION 'INVITACION_NO_VALIDA: la invitación ya fue %', v_invitacion.status;
  END IF;
  
  -- Validar expiración
  IF NOW() > v_invitacion.expira_en THEN
    RAISE EXCEPTION 'INVITACION_EXPIRADA';
  END IF;
  
  -- Obtener email del usuario autenticado
  SELECT id, email INTO v_user_id, v_user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'USUARIO_NO_AUTENTICADO';
  END IF;
  
  -- Validar que el email del usuario coincida con la invitación
  IF lower(v_user_email) <> lower(v_invitacion.email) THEN
    RAISE EXCEPTION 'EMAIL_NO_COINCIDE: esta invitación es para otro email';
  END IF;
  
  -- Verificar que el usuario no sea ya miembro activo de esta clínica
  IF EXISTS (
    SELECT 1 FROM public.miembros_clinica mc
    WHERE mc.clinica_id = v_invitacion.clinica_id
      AND mc.user_id = v_user_id
      AND mc.activo = true
  ) THEN
    RAISE EXCEPTION 'YA_ES_MIEMBRO: ya eres miembro activo de esta clínica';
  END IF;
  
  -- Crear membresía
  INSERT INTO public.miembros_clinica (
    clinica_id, user_id, rol, activo, invitado_por, fecha_invitacion
  ) VALUES (
    v_invitacion.clinica_id, v_user_id, v_invitacion.rol, true, 
    v_invitacion.invitado_por, v_invitacion.creada_en
  );
  
  -- Marcar invitación como aceptada
  UPDATE public.invitaciones_clinica
  SET status = 'accepted',
      aceptada_en = NOW(),
      aceptada_por = v_user_id
  WHERE id = v_invitacion.id;
  
  RETURN v_invitacion.clinica_id;
END;
$$;

COMMENT ON FUNCTION public.aceptar_invitacion(TEXT) IS
  'F7-11: Acepta invitación con token. Valida email del usuario autenticado. Crea membresía. Retorna clinica_id.';

GRANT EXECUTE ON FUNCTION public.aceptar_invitacion(TEXT) TO authenticated;

-- 6. RPC: revocar_invitacion()
-- ============================================================
-- Solo admin de la clínica puede revocar invitaciones pendientes.
CREATE OR REPLACE FUNCTION public.revocar_invitacion(
  p_invitacion_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitacion public.invitaciones_clinica%ROWTYPE;
BEGIN
  IF p_invitacion_id IS NULL THEN
    RAISE EXCEPTION 'ID de invitación requerido';
  END IF;
  
  -- Buscar invitación
  SELECT * INTO v_invitacion
  FROM public.invitaciones_clinica
  WHERE id = p_invitacion_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVITACION_NO_ENCONTRADA';
  END IF;
  
  -- Verificar que el usuario actual sea admin de la clínica de la invitación
  IF NOT EXISTS (
    SELECT 1 FROM public.miembros_clinica mc
    WHERE mc.user_id = auth.uid()
      AND mc.clinica_id = v_invitacion.clinica_id
      AND mc.rol::text = 'admin'
      AND mc.activo = true
  ) THEN
    RAISE EXCEPTION 'PERMISO_DENEGADO: solo administradores de la clínica pueden revocar invitaciones';
  END IF;
  
  -- Solo revocar si está pendiente
  IF v_invitacion.status <> 'pending' THEN
    RAISE EXCEPTION 'INVITACION_NO_PENDIENTE: no se puede revocar una invitación %', v_invitacion.status;
  END IF;
  
  -- Marcar como revocada
  UPDATE public.invitaciones_clinica
  SET status = 'revoked'
  WHERE id = p_invitacion_id;
  
  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.revocar_invitacion(UUID) IS
  'F7-11: Revoca invitación pendiente. Solo admin de la clínica de la invitación.';

GRANT EXECUTE ON FUNCTION public.revocar_invitacion(UUID) TO authenticated;

-- 7. RPC: listar_invitaciones_clinica()
-- ============================================================
-- Lista invitaciones de la clínica activa (para el módulo de gestión).
-- Solo admin puede ver todas; otros roles solo ven invitaciones de su email.
CREATE OR REPLACE FUNCTION public.listar_invitaciones_clinica()
RETURNS TABLE (
  id UUID,
  email TEXT,
  rol public.app_role,
  status TEXT,
  invitado_por UUID,
  creada_en TIMESTAMPTZ,
  expira_en TIMESTAMPTZ,
  token TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_es_admin BOOLEAN;
  v_user_email TEXT;
BEGIN
  v_es_admin := public.puede_invitar_miembro();
  
  IF v_es_admin THEN
    -- Admin ve todas las invitaciones de su clínica activa
    RETURN QUERY
    SELECT i.id, i.email, i.rol, i.status, i.invitado_por, 
           i.creada_en, i.expira_en, i.token
    FROM public.invitaciones_clinica i
    WHERE i.clinica_id = public.clinica_actual()
    ORDER BY i.creada_en DESC;
  ELSE
    -- No-admin solo ve invitaciones pendientes de su propio email
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = auth.uid();
    
    RETURN QUERY
    SELECT i.id, i.email, i.rol, i.status, i.invitado_por,
           i.creada_en, i.expira_en, i.token
    FROM public.invitaciones_clinica i
    WHERE lower(i.email) = lower(v_user_email)
      AND i.status = 'pending'
      AND NOW() < i.expira_en
    ORDER BY i.creada_en DESC;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.listar_invitaciones_clinica() IS
  'F7-11: Lista invitaciones. Admin ve todas de su clínica; otros solo las suyas pendientes.';

GRANT EXECUTE ON FUNCTION public.listar_invitaciones_clinica() TO authenticated;

-- 8. Políticas RLS para acceso directo a la tabla (fallback)
-- ============================================================
-- Nota: el acceso principal es vía RPCs (SECURITY DEFINER).
-- Estas políticas son para queries directas desde el frontend si es necesario.

-- Admin puede leer invitaciones de su clínica activa
DROP POLICY IF EXISTS "admin_lee_invitaciones" ON public.invitaciones_clinica;
CREATE POLICY "admin_lee_invitaciones" ON public.invitaciones_clinica
  FOR SELECT
  USING (
    clinica_id = public.clinica_actual()
    AND public.puede_invitar_miembro()
  );

-- Admin puede insertar invitaciones en su clínica activa
DROP POLICY IF EXISTS "admin_inserta_invitaciones" ON public.invitaciones_clinica;
CREATE POLICY "admin_inserta_invitaciones" ON public.invitaciones_clinica
  FOR INSERT
  WITH CHECK (
    clinica_id = public.clinica_actual()
    AND public.puede_invitar_miembro()
  );

-- Admin puede actualizar invitaciones de su clínica activa
DROP POLICY IF EXISTS "admin_actualiza_invitaciones" ON public.invitaciones_clinica;
CREATE POLICY "admin_actualiza_invitaciones" ON public.invitaciones_clinica
  FOR UPDATE
  USING (
    clinica_id = public.clinica_actual()
    AND public.puede_invitar_miembro()
  );

-- No-admin puede leer invitaciones pendientes de su propio email
DROP POLICY IF EXISTS "invitado_lee_su_invitacion" ON public.invitaciones_clinica;
CREATE POLICY "invitado_lee_su_invitacion" ON public.invitaciones_clinica
  FOR SELECT
  USING (
    status = 'pending'
    AND NOW() < expira_en
    AND lower(email) = (SELECT lower(email) FROM auth.users WHERE id = auth.uid())
  );

-- 9. GRANTs de tabla
-- ============================================================
GRANT SELECT, INSERT, UPDATE ON public.invitaciones_clinica TO authenticated;

-- 10. Comentarios de auditoría
-- ============================================================
COMMENT ON TABLE public.invitaciones_clinica IS
  'F7-11: Invitaciones de miembros a clínicas. Flujo seguro sin service_role en frontend. Admins invitan, invitados aceptan con token.';
