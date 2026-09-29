-- F7-37: Endurecer search_path de 17 funciones SECURITY DEFINER
--
-- PROBLEMA (auditoría F7-37):
-- - auditar_cambio() y 2 funciones de purge NO tenían SET search_path
-- - 14 funciones SECURITY DEFINER pre-F7-36 tenían SET search_path = public
--   (vulnerables a search_path hijacking si atacante crea objetos en schema temporal)
--
-- SOLUCIÓN:
-- CREATE OR REPLACE todas las funciones con SET search_path = ''
-- y calificar explícitamente todas las referencias a tablas/funciones.
--
-- FUNCIONES ENDURECIDAS (17):
--   1. auditar_cambio()          - trigger append-only (11 tablas)
--   2. clinica_actual()          - base de 80+ policies RLS
--   3. es_admin_de_clinica_actual()
--   4. rol_en_clinica_actual()
--   5. tiene_rol_en_clinica()
--   6. set_clinica_id_on_insert()
--   7. puede_invitar_miembro()
--   8. invitar_miembro()
--   9. aceptar_invitacion()
--  10. revocar_invitacion()
--  11. listar_invitaciones_clinica()
--  12. verificar_bootstrap_necesario()
--  13. bootstrap_clinica()
--  14. registrar_exportacion()
--  15. purgar_archivos_expirados()
--  16. purgar_certificados_expirados()
--  17. validar_eliminado_at_certificados()
--
-- PRINCIPIO: Uniformidad > minimalismo. CREATE OR REPLACE para todas.
-- Idempotente: puede ejecutarse múltiples veces sin error.
-- NO modifica permisos (REVOKE/GRANT preservados del original).
-- NO modifica triggers que las llaman.
-- ============================================================

-- ============================================================
-- 1. auditar_cambio() — trigger append-only
-- ============================================================
CREATE OR REPLACE FUNCTION public.auditar_cambio()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_clinica_id UUID;
  v_action TEXT;
  v_old_data JSONB;
  v_new_data JSONB;
  v_record_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    v_action := 'INSERT';
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
    v_clinica_id := NEW.clinica_id;
    v_record_id := NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_clinica_id := NEW.clinica_id;
    v_record_id := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
    v_clinica_id := OLD.clinica_id;
    v_record_id := OLD.id;
  END IF;
  
  INSERT INTO public.audit_log (
    user_id, user_email, clinica_id, table_name, record_id,
    action, old_data, new_data, created_at
  ) VALUES (
    v_user_id, v_user_email, v_clinica_id, TG_TABLE_NAME, v_record_id,
    v_action, v_old_data, v_new_data, NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

ALTER FUNCTION public.auditar_cambio() OWNER TO postgres;

COMMENT ON FUNCTION public.auditar_cambio() IS
  'F7-37: Trigger SECURITY DEFINER (owner postgres, BYPASSRLS) con search_path vacío. '
  'Registra cambios en audit_log. Todas las referencias calificadas con public.';

-- ============================================================
-- 2. clinica_actual() — base de 80+ policies RLS (F7-35 fail-closed)
-- ============================================================
CREATE OR REPLACE FUNCTION public.clinica_actual()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (
    SELECT mc.clinica_id
    FROM public.miembros_clinica mc
    WHERE mc.user_id = auth.uid()
      AND mc.activo
      AND mc.clinica_id = (
        CASE
          WHEN (auth.jwt() -> 'user_metadata' ->> 'clinica_id')
               ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
          THEN (auth.jwt() -> 'user_metadata' ->> 'clinica_id')::uuid
        END
      )
    LIMIT 1
  );
$$;

REVOKE ALL ON FUNCTION public.clinica_actual() FROM anon;
GRANT EXECUTE ON FUNCTION public.clinica_actual() TO authenticated, service_role;

COMMENT ON FUNCTION public.clinica_actual() IS
  'F7-37: fail-closed + regex-guard UUID + search_path vacío. Base de RLS multi-tenant.';

-- ============================================================
-- 3. es_admin_de_clinica_actual()
-- ============================================================
CREATE OR REPLACE FUNCTION public.es_admin_de_clinica_actual()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.miembros_clinica
    WHERE user_id = (select auth.uid())
      AND rol::text = 'admin'
      AND activo
      AND clinica_id = public.clinica_actual()
  );
$$;

REVOKE ALL ON FUNCTION public.es_admin_de_clinica_actual() FROM anon;
GRANT EXECUTE ON FUNCTION public.es_admin_de_clinica_actual() TO authenticated, service_role;

COMMENT ON FUNCTION public.es_admin_de_clinica_actual() IS
  'F7-37: TRUE si usuario es admin de clínica activa. search_path vacío.';

-- ============================================================
-- 4. rol_en_clinica_actual()
-- ============================================================
CREATE OR REPLACE FUNCTION public.rol_en_clinica_actual()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT rol::public.app_role
  FROM public.miembros_clinica
  WHERE user_id = (select auth.uid())
    AND clinica_id = public.clinica_actual()
    AND activo
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.rol_en_clinica_actual() FROM anon;
GRANT EXECUTE ON FUNCTION public.rol_en_clinica_actual() TO authenticated, service_role;

COMMENT ON FUNCTION public.rol_en_clinica_actual() IS
  'F7-37: Rol del usuario en su clínica actual. search_path vacío.';

-- ============================================================
-- 5. tiene_rol_en_clinica()
-- ============================================================
CREATE OR REPLACE FUNCTION public.tiene_rol_en_clinica(_roles public.app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.rol_en_clinica_actual() = ANY(_roles);
$$;

REVOKE ALL ON FUNCTION public.tiene_rol_en_clinica(public.app_role[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.tiene_rol_en_clinica(public.app_role[]) TO authenticated, service_role;

COMMENT ON FUNCTION public.tiene_rol_en_clinica(public.app_role[]) IS
  'F7-37: TRUE si rol está en la lista. search_path vacío.';

-- ============================================================
-- 6. set_clinica_id_on_insert() — trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_clinica_id_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_clinica UUID;
BEGIN
  IF NEW.clinica_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_clinica := public.clinica_actual();
  
  IF v_clinica IS NULL THEN
    RAISE EXCEPTION 'Usuario % no tiene membresía activa en ninguna clínica', auth.uid();
  END IF;

  NEW.clinica_id := v_clinica;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_clinica_id_on_insert() FROM anon;
GRANT EXECUTE ON FUNCTION public.set_clinica_id_on_insert() TO authenticated, service_role;

COMMENT ON FUNCTION public.set_clinica_id_on_insert() IS
  'F7-37: BEFORE INSERT trigger. search_path vacío.';

-- ============================================================
-- 7. puede_invitar_miembro()
-- ============================================================
CREATE OR REPLACE FUNCTION public.puede_invitar_miembro()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

GRANT EXECUTE ON FUNCTION public.puede_invitar_miembro() TO authenticated;

COMMENT ON FUNCTION public.puede_invitar_miembro() IS
  'F7-37: TRUE si usuario es admin de clínica activa. search_path vacío.';

-- ============================================================
-- 8. invitar_miembro()
-- ============================================================
CREATE OR REPLACE FUNCTION public.invitar_miembro(
  p_email TEXT,
  p_rol public.app_role
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_clinica_id UUID;
  v_token TEXT;
  v_invitacion_id UUID;
  v_email_normalizado TEXT;
BEGIN
  IF p_email IS NULL OR trim(p_email) = '' THEN
    RAISE EXCEPTION 'Email requerido';
  END IF;
  
  IF p_rol IS NULL THEN
    RAISE EXCEPTION 'Rol requerido';
  END IF;
  
  IF p_rol NOT IN ('admin', 'dentista', 'asistente', 'recepcion') THEN
    RAISE EXCEPTION 'Rol inválido: %', p_rol;
  END IF;
  
  IF NOT public.puede_invitar_miembro() THEN
    RAISE EXCEPTION 'PERMISO_DENEGADO: solo administradores pueden invitar miembros';
  END IF;
  
  v_clinica_id := public.clinica_actual();
  
  IF v_clinica_id IS NULL THEN
    RAISE EXCEPTION 'No hay clínica activa seleccionada';
  END IF;
  
  v_email_normalizado := lower(trim(p_email));
  
  IF EXISTS (
    SELECT 1 FROM public.miembros_clinica mc
    JOIN auth.users u ON u.id = mc.user_id
    WHERE mc.clinica_id = v_clinica_id
      AND lower(u.email) = v_email_normalizado
      AND mc.activo = true
  ) THEN
    RAISE EXCEPTION 'Este email ya es miembro activo de la clínica';
  END IF;
  
  v_token := substr(
    md5(random()::text || clock_timestamp()::text) ||
    md5(random()::text || clock_timestamp()::text),
    1, 64
  );
  
  INSERT INTO public.invitaciones_clinica (
    clinica_id, email, rol, token, status, invitado_por
  ) VALUES (
    v_clinica_id, v_email_normalizado, p_rol, v_token, 'pending', auth.uid()
  )
  RETURNING id INTO v_invitacion_id;
  
  RETURN v_invitacion_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.invitar_miembro(TEXT, public.app_role) TO authenticated;

COMMENT ON FUNCTION public.invitar_miembro(TEXT, public.app_role) IS
  'F7-37: Crea invitación. Solo admin. search_path vacío.';

-- ============================================================
-- 9. aceptar_invitacion()
-- ============================================================
CREATE OR REPLACE FUNCTION public.aceptar_invitacion(
  p_token TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_invitacion public.invitaciones_clinica%ROWTYPE;
  v_user_email TEXT;
  v_user_id UUID;
BEGIN
  IF p_token IS NULL OR trim(p_token) = '' THEN
    RAISE EXCEPTION 'Token requerido';
  END IF;
  
  SELECT * INTO v_invitacion
  FROM public.invitaciones_clinica
  WHERE token = p_token;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVITACION_NO_ENCONTRADA';
  END IF;
  
  IF v_invitacion.status <> 'pending' THEN
    RAISE EXCEPTION 'INVITACION_NO_VALIDA: la invitación ya fue %', v_invitacion.status;
  END IF;
  
  IF NOW() > v_invitacion.expira_en THEN
    RAISE EXCEPTION 'INVITACION_EXPIRADA';
  END IF;
  
  SELECT id, email INTO v_user_id, v_user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'USUARIO_NO_AUTENTICADO';
  END IF;
  
  IF lower(v_user_email) <> lower(v_invitacion.email) THEN
    RAISE EXCEPTION 'EMAIL_NO_COINCIDE: esta invitación es para otro email';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM public.miembros_clinica mc
    WHERE mc.clinica_id = v_invitacion.clinica_id
      AND mc.user_id = v_user_id
      AND mc.activo = true
  ) THEN
    RAISE EXCEPTION 'YA_ES_MIEMBRO: ya eres miembro activo de esta clínica';
  END IF;
  
  INSERT INTO public.miembros_clinica (
    clinica_id, user_id, rol, activo, invitado_por, fecha_invitacion
  ) VALUES (
    v_invitacion.clinica_id, v_user_id, v_invitacion.rol, true, 
    v_invitacion.invitado_por, v_invitacion.creada_en
  );
  
  UPDATE public.invitaciones_clinica
  SET status = 'accepted',
      aceptada_en = NOW(),
      aceptada_por = v_user_id
  WHERE id = v_invitacion.id;
  
  RETURN v_invitacion.clinica_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.aceptar_invitacion(TEXT) TO authenticated;

COMMENT ON FUNCTION public.aceptar_invitacion(TEXT) IS
  'F7-37: Acepta invitación. Valida email. search_path vacío.';

-- ============================================================
-- 10. revocar_invitacion()
-- ============================================================
CREATE OR REPLACE FUNCTION public.revocar_invitacion(
  p_invitacion_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_invitacion public.invitaciones_clinica%ROWTYPE;
BEGIN
  IF p_invitacion_id IS NULL THEN
    RAISE EXCEPTION 'ID de invitación requerido';
  END IF;
  
  SELECT * INTO v_invitacion
  FROM public.invitaciones_clinica
  WHERE id = p_invitacion_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVITACION_NO_ENCONTRADA';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM public.miembros_clinica mc
    WHERE mc.user_id = auth.uid()
      AND mc.clinica_id = v_invitacion.clinica_id
      AND mc.rol::text = 'admin'
      AND mc.activo = true
  ) THEN
    RAISE EXCEPTION 'PERMISO_DENEGADO: solo administradores de la clínica pueden revocar invitaciones';
  END IF;
  
  IF v_invitacion.status <> 'pending' THEN
    RAISE EXCEPTION 'INVITACION_NO_PENDIENTE: no se puede revocar una invitación %', v_invitacion.status;
  END IF;
  
  UPDATE public.invitaciones_clinica
  SET status = 'revoked'
  WHERE id = p_invitacion_id;
  
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revocar_invitacion(UUID) TO authenticated;

COMMENT ON FUNCTION public.revocar_invitacion(UUID) IS
  'F7-37: Revoca invitación. Solo admin. search_path vacío.';

-- ============================================================
-- 11. listar_invitaciones_clinica()
-- ============================================================
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
SET search_path = ''
AS $$
DECLARE
  v_es_admin BOOLEAN;
  v_user_email TEXT;
BEGIN
  v_es_admin := public.puede_invitar_miembro();
  
  IF v_es_admin THEN
    RETURN QUERY
    SELECT i.id, i.email, i.rol, i.status, i.invitado_por, 
           i.creada_en, i.expira_en, i.token
    FROM public.invitaciones_clinica i
    WHERE i.clinica_id = public.clinica_actual()
    ORDER BY i.creada_en DESC;
  ELSE
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

GRANT EXECUTE ON FUNCTION public.listar_invitaciones_clinica() TO authenticated;

COMMENT ON FUNCTION public.listar_invitaciones_clinica() IS
  'F7-37: Lista invitaciones. search_path vacío.';

-- ============================================================
-- 12. verificar_bootstrap_necesario()
-- ============================================================
CREATE OR REPLACE FUNCTION public.verificar_bootstrap_necesario()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.miembros_clinica mc
    WHERE mc.user_id = auth.uid()
      AND mc.activo = true
  );
$$;

COMMENT ON FUNCTION public.verificar_bootstrap_necesario() IS
  'F7-37: TRUE si usuario no tiene membresía. search_path vacío.';

-- ============================================================
-- 13. bootstrap_clinica()
-- ============================================================
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
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_clinica_id UUID;
  v_ultima_clinica_creada TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'NO_AUTENTICADO: debes iniciar sesión';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.miembros_clinica mc
    WHERE mc.user_id = v_user_id
      AND mc.activo = true
  ) THEN
    RAISE EXCEPTION 'YA_TIENE_CLINICA: ya tienes una clínica activa';
  END IF;

  SELECT MAX(c.created_at) INTO v_ultima_clinica_creada
  FROM public.clinicas c
  JOIN public.miembros_clinica mc ON mc.clinica_id = c.id
  WHERE mc.user_id = v_user_id
    AND mc.rol::text = 'admin'
    AND mc.invitado_por IS NULL;

  IF v_ultima_clinica_creada IS NOT NULL
     AND v_ultima_clinica_creada > NOW() - INTERVAL '24 hours' THEN
    RAISE EXCEPTION 'RATE_LIMIT: ya creaste una clínica recientemente';
  END IF;

  IF p_nombre IS NULL OR trim(p_nombre) = '' THEN
    RAISE EXCEPTION 'NOMBRE_REQUERIDO';
  END IF;

  IF length(trim(p_nombre)) < 3 THEN
    RAISE EXCEPTION 'NOMBRE_MUY_CORTO';
  END IF;

  IF length(trim(p_nombre)) > 100 THEN
    RAISE EXCEPTION 'NOMBRE_MUY_LARGO';
  END IF;

  IF p_rut_empresa IS NOT NULL AND trim(p_rut_empresa) <> '' THEN
    IF EXISTS (
      SELECT 1 FROM public.clinicas
      WHERE rut_empresa = trim(p_rut_empresa)
    ) THEN
      RAISE EXCEPTION 'RUT_DUPLICADO';
    END IF;
  END IF;

  BEGIN
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

    INSERT INTO public.miembros_clinica (
      clinica_id, user_id, rol, activo, invitado_por, fecha_invitacion
    ) VALUES (
      v_clinica_id, v_user_id, 'admin'::public.app_role, true, NULL, NOW()
    );

    UPDATE public.profiles
    SET role = 'admin'::public.app_role, updated_at = NOW()
    WHERE id = v_user_id;

    RETURN v_clinica_id;

  EXCEPTION WHEN OTHERS THEN
    RAISE;
  END;
END;
$$;

COMMENT ON FUNCTION public.bootstrap_clinica(TEXT, TEXT, TEXT, TEXT, TEXT) IS
  'F7-37: Crea clínica trial + membresía admin. search_path vacío.';

-- ============================================================
-- 14. registrar_exportacion()
-- ============================================================
CREATE OR REPLACE FUNCTION public.registrar_exportacion(
  p_formato text,
  p_tipo text,
  p_periodo text DEFAULT 'sin_periodo'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_user_email text;
  v_clinica_id UUID;
  v_export_count INTEGER;
  v_record_id UUID;
  v_new_data jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'NO_AUTENTICADO';
  END IF;

  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  v_clinica_id := public.clinica_actual();
  IF v_clinica_id IS NULL THEN
    RAISE EXCEPTION 'SIN_CLINICA';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.miembros_clinica mc
    WHERE mc.user_id = v_user_id
      AND mc.clinica_id = v_clinica_id
      AND mc.activo = true
  ) THEN
    RAISE EXCEPTION 'NO_MIEMBRO';
  END IF;

  SELECT COUNT(*) INTO v_export_count
  FROM public.audit_log
  WHERE user_id = v_user_id
    AND action = 'EXPORT'
    AND created_at >= NOW() - INTERVAL '1 hour';

  IF v_export_count >= 100 THEN
    RAISE EXCEPTION 'RATE_LIMIT';
  END IF;

  IF p_formato NOT IN ('pdf', 'excel') THEN
    RAISE EXCEPTION 'FORMATO_INVALIDO';
  END IF;

  IF p_tipo NOT IN ('completo', 'ranking', 'rendimiento') THEN
    RAISE EXCEPTION 'TIPO_INVALIDO';
  END IF;

  v_new_data := jsonb_build_object(
    'formato', p_formato,
    'tipo', p_tipo,
    'periodo', p_periodo,
    'timestamp', NOW()
  );

  v_record_id := gen_random_uuid();

  INSERT INTO public.audit_log (
    id, user_id, user_email, table_name, record_id,
    action, old_data, new_data, resolution_strategy, clinica_id
  ) VALUES (
    v_record_id, v_user_id, v_user_email, 'reportes', v_record_id::text,
    'EXPORT', NULL, v_new_data, NULL, v_clinica_id
  );

  RETURN v_record_id;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_exportacion(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_exportacion(text, text, text) TO authenticated;

COMMENT ON FUNCTION public.registrar_exportacion(text, text, text) IS
  'F7-37: Registra exportación. Rate limit 100/h. search_path vacío.';

-- ============================================================
-- 15. purgar_archivos_expirados() — pg_cron
-- ============================================================
CREATE OR REPLACE FUNCTION public.purgar_archivos_expirados()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $body$
DECLARE
  v_archivos RECORD;
  v_archivo_ids UUID[] := ARRAY[]::UUID[];
  v_count INTEGER := 0;
  v_supabase_url TEXT := 'https://nagduvivilmzupdpoayo.supabase.co';
  v_service_key TEXT;
  v_result BIGINT;
BEGIN
  SELECT value INTO v_service_key 
  FROM public.system_config 
  WHERE key = 'internal_purge_secret';
  
  IF v_service_key IS NULL OR v_service_key = '' THEN
    RAISE WARNING '[F7-37] internal_purge_secret no configurada. Abortando purga.'
      USING HINT = 'INSERT INTO public.system_config (key, value) VALUES (''internal_purge_secret'', ''<SECRETO>'');';
    RETURN;
  END IF;

  FOR v_archivos IN
    SELECT id, clinica_id, nombre_archivo, deleted_at
    FROM public.archivos_clinicos
    WHERE estado = 'eliminado'
      AND deleted_at IS NOT NULL
      AND deleted_at < NOW() - INTERVAL '30 days'
    ORDER BY deleted_at ASC
    LIMIT 100
  LOOP
    v_archivo_ids := array_append(v_archivo_ids, v_archivos.id);
    v_count := v_count + 1;
  END LOOP;

  IF v_count = 0 THEN
    RAISE NOTICE '[F7-37] No hay archivos expirados para purgar.';
    RETURN;
  END IF;

  RAISE NOTICE '[F7-37] Encontrados % archivos para purgar.', v_count;

  BEGIN
    PERFORM net.http_post(
      url := v_supabase_url || '/functions/v1/archivos-purge',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'X-Internal-Secret', v_service_key
      ),
      body := jsonb_build_object(
        'archivo_ids', v_archivo_ids
      )
    );
    RAISE NOTICE '[F7-37] Request encolada para % archivo(s).', v_count;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING '[F7-37] Error encolando request: %', SQLERRM;
  END;
END;
$body$;

COMMENT ON FUNCTION public.purgar_archivos_expirados() IS 
  'F7-37: Purga archivos >30 días. Invoca archivos-purge vía pg_net. search_path vacío.';

-- ============================================================
-- 16. purgar_certificados_expirados() — pg_cron
-- ============================================================
CREATE OR REPLACE FUNCTION public.purgar_certificados_expirados()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_cert RECORD;
  v_archivo_ids UUID[] := ARRAY[]::UUID[];
  v_count INTEGER := 0;
  v_archivo_id UUID;
  v_supabase_url TEXT := 'https://nagduvivilmzupdpoayo.supabase.co';
  v_service_key TEXT;
BEGIN
  SELECT value INTO v_service_key
  FROM public.system_config
  WHERE key = 'internal_purge_secret';

  IF v_service_key IS NULL OR v_service_key = '' THEN
    RAISE WARNING '[F7-37] internal_purge_secret no configurada. Abortando purga.'
      USING HINT = 'INSERT INTO public.system_config (key, value) VALUES (''internal_purge_secret'', ''<SECRETO>'');';
    RETURN;
  END IF;

  FOR v_cert IN
    SELECT id, clinica_id, datos, eliminado_at
    FROM public.certificados
    WHERE eliminado_at IS NOT NULL
      AND eliminado_at < NOW() - INTERVAL '730 days'
    ORDER BY eliminado_at ASC
    LIMIT 100
  LOOP
    v_archivo_id := (v_cert.datos->>'r2ArchivoId')::UUID;
    IF v_archivo_id IS NOT NULL THEN
      v_archivo_ids := array_append(v_archivo_ids, v_archivo_id);
    END IF;
    v_count := v_count + 1;
  END LOOP;

  IF v_count = 0 THEN
    RAISE NOTICE '[F7-37] No hay certificados vencidos para purgar.';
    RETURN;
  END IF;

  RAISE NOTICE '[F7-37] Encontrados % certificados vencidos.', v_count;

  IF array_length(v_archivo_ids, 1) > 0 THEN
    BEGIN
      PERFORM net.http_post(
        url := v_supabase_url || '/functions/v1/archivos-purge',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-Internal-Secret', v_service_key
        ),
        body := jsonb_build_object(
          'archivo_ids', v_archivo_ids
        )
      );
      RAISE NOTICE '[F7-37] Request encolada para % archivo(s) R2.', array_length(v_archivo_ids, 1);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '[F7-37] Error encolando R2: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '[F7-37] No hay archivos R2 asociados.';
  END IF;

  DELETE FROM public.certificados
  WHERE eliminado_at IS NOT NULL
    AND eliminado_at < NOW() - INTERVAL '730 days'
    AND id IN (SELECT id FROM (
      SELECT id FROM public.certificados
      WHERE eliminado_at IS NOT NULL
        AND eliminado_at < NOW() - INTERVAL '730 days'
      ORDER BY eliminado_at ASC
      LIMIT 100
    ) AS subq);

  RAISE NOTICE '[F7-37] Eliminadas % filas de certificados.', v_count;
END;
$$;

COMMENT ON FUNCTION public.purgar_certificados_expirados() IS
  'F7-37: Purga certificados >730 días. search_path vacío.';

-- ============================================================
-- 17. validar_eliminado_at_certificados() — trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.validar_eliminado_at_certificados()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (OLD.eliminado_at IS NULL AND NEW.eliminado_at IS NOT NULL) OR
     (OLD.eliminado_at IS NOT NULL AND NEW.eliminado_at IS NULL) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.miembros_clinica
      WHERE user_id = auth.uid()
        AND clinica_id = NEW.clinica_id
        AND rol::text = 'admin'
    ) THEN
      RAISE EXCEPTION 'Solo los administradores pueden mover certificados a la papelera o restaurarlos'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.validar_eliminado_at_certificados() IS
  'F7-37: Valida que solo admin puede cambiar eliminado_at. search_path vacío.';

-- ============================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ============================================================
DO $$
DECLARE
  r RECORD;
  total_funcs INTEGER := 0;
  total_hardened INTEGER := 0;
BEGIN
  RAISE NOTICE 'F7-37: Verificando search_path de funciones SECURITY DEFINER...';
  
  FOR r IN
    SELECT
      p.proname AS function_name,
      p.proconfig AS config,
      p.prosecdef AS is_security_definer
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proname IN (
        'auditar_cambio', 'clinica_actual', 'es_admin_de_clinica_actual',
        'rol_en_clinica_actual', 'tiene_rol_en_clinica', 'set_clinica_id_on_insert',
        'puede_invitar_miembro', 'invitar_miembro', 'aceptar_invitacion',
        'revocar_invitacion', 'listar_invitaciones_clinica',
        'verificar_bootstrap_necesario', 'bootstrap_clinica',
        'registrar_exportacion', 'purgar_archivos_expirados',
        'purgar_certificados_expirados', 'validar_eliminado_at_certificados'
      )
  LOOP
    total_funcs := total_funcs + 1;
    IF r.config IS NOT NULL AND r.config::text LIKE '%search_path=%' THEN
      total_hardened := total_hardened + 1;
      RAISE NOTICE '  ✅ %: %', r.function_name, r.config;
    ELSE
      RAISE WARNING '  ⚠️  %: sin search_path (config: %)', r.function_name, r.config;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'F7-37: %/% funciones SECURITY DEFINER con search_path endurecido',
    total_hardened, total_funcs;
  
  IF total_hardened < total_funcs THEN
    RAISE WARNING 'F7-37: Quedan funciones sin search_path endurecido';
  END IF;
END;
$$;
