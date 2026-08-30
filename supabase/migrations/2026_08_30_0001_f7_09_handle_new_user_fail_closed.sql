-- ============================================================
-- F7-09: handle_new_user() no confía en rol del cliente + fail-closed
--
-- VULNERABILIDAD CORREGIDA:
-- Antes: handle_new_user() leía raw_user_meta_data.role y lo aceptaba si era válido.
--        Un atacante podía hacer signUp con {role: 'admin'} y obtener privilegios.
--
-- SOLUCIÓN:
-- handle_new_user() IGNORA raw_user_meta_data.role.
-- Asigna siempre rol inicial seguro: 'recepcion' (el menos privilegiado).
-- El rol real se asignará vía miembros_clinica (F7-11 implementará onboarding seguro).
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- F7-09: IGNORAR raw_user_meta_data.role por seguridad
  -- Un atacante NO debe poder auto-asignarse roles privilegiados
  -- El rol inicial SIEMPRE es 'recepcion' (el menos privilegiado)
  -- El rol real se asignará vía miembros_clinica (F7-11)
  
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    'recepcion'::app_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
        role = 'recepcion'::app_role,
        updated_at = NOW();

  -- Propagar el rol a app_metadata (donde el JWT lo leerá)
  PERFORM public.set_app_metadata_role(NEW.id, 'recepcion'::app_role);

  RETURN NEW;
END;
$$;

-- Actualizar comentario para documentar el cambio
COMMENT ON FUNCTION public.handle_new_user() IS
  'F7-09: Trigger AFTER INSERT en auth.users. IGNORA rol del cliente por seguridad, asigna recepcion por defecto. El rol real se asigna vía miembros_clinica (F7-11).';
