-- ============================================================
-- F7-36 FASE 5 (Commit 5.1): Identidad real del actor en
-- registrar_evento_archivo
-- ============================================================
--
-- OBJETIVO:
-- Resolver user_id = null en audit_log para eventos FILE_*.
-- El flujo correcto es: JWT usuario -> validacion -> user_id
-- real -> Edge Function -> RPC -> audit_log.user_id = usuario real.
--
-- PROBLEMA DETECTADO (auditoría de datos reales):
-- Todos los eventos FILE_UPLOAD, FILE_DOWNLOAD, FILE_DELETE,
-- FILE_RESTORE tienen user_id = null en audit_log.
--
-- Causa raiz: las Edge Functions invocan registrar_evento_archivo
-- con SUPABASE_SERVICE_ROLE_KEY. Dentro de la funcion, auth.uid()
-- retorna null porque el JWT es de service_role, no del usuario.
--
-- SOLUCION:
-- Agregar parametro p_user_id UUID DEFAULT NULL a la funcion
-- (backward compatible con llamados viejos). Las Edge Functions
-- pasan el user_id real extraido del JWT del usuario.
--
-- REFERENCIA DE DISENO:
-- registrar_evento_purge v2 (FASE 2, 20260101000017) ya resolvio
-- este mismo problema con la misma tecnica.
--
-- PRINCIPIO CONSERVADOR:
-- - DEFAULT NULL: llamados viejos siguen funcionando (caen a
--   auth.uid() = null, comportamiento actual)
-- - COALESCE(p_user_id, auth.uid()): si alguien pasa null
--   explicitamente, sigue funcionando
-- - NO se toca la logica de limpieza de PHI (FASE 4)
-- - NO se tocan permisos (FASE 2)
-- - NO se toca search_path (FASE 3, vacio)
--
-- TEST OBLIGATORIO DEL BRIEF:
-- "Dentista A descarga archivo -> audit_log.user_id = Dentista A.
--  Dentista B descarga archivo -> audit_log.user_id = Dentista B.
--  No deben confundirse."
--
-- VALIDACION POST-APLICACION:
-- Subir archivo en la app como usuario autenticado, luego:
--
--   SELECT action, user_id, created_at
--   FROM audit_log
--   WHERE action = 'FILE_UPLOAD'
--   ORDER BY created_at DESC LIMIT 1;
--
-- Esperado: user_id = UUID del usuario autenticado (no null)
-- ============================================================

-- ============================================================
-- Reescribir registrar_evento_archivo con parametro p_user_id
-- ============================================================
CREATE OR REPLACE FUNCTION public.registrar_evento_archivo(
  p_archivo_id uuid,
  p_evento text,
  p_detalle jsonb DEFAULT '{}'::jsonb,
  p_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_archivo RECORD;
  v_detalle_limpio jsonb;
BEGIN
  -- Obtener datos minimos del archivo (sin nombre_archivo)
  SELECT clinica_id, paciente_id, categoria, tamano_bytes
  INTO v_archivo
  FROM public.archivos_clinicos
  WHERE id = p_archivo_id;

  IF v_archivo IS NULL THEN
    RAISE EXCEPTION 'Archivo no encontrado: %', p_archivo_id;
  END IF;

  -- Limpiar el detalle: quitar duplicados que ya estan top-level
  -- y remover cualquier r2_object_key / nombre_archivo que las
  -- Edge Functions puedan haber mandado (defensa en profundidad)
  v_detalle_limpio := p_detalle
    - 'nombre_archivo'
    - 'r2_object_key'
    - 'paciente_id'
    - 'categoria'
    - 'tamano_bytes'
    - 'estado'
    - 'evento'
    - 'timestamp';

  -- Insertar en audit_log con columnas correctas
  INSERT INTO public.audit_log (
    clinica_id,
    user_id,
    table_name,
    record_id,
    action,
    new_data
  ) VALUES (
    v_archivo.clinica_id,
    COALESCE(p_user_id, auth.uid()),
    'archivos_clinicos',
    p_archivo_id::text,
    p_evento,
    jsonb_build_object(
      'evento', p_evento,
      'paciente_id', v_archivo.paciente_id,
      'categoria', v_archivo.categoria,
      'tamano_bytes', v_archivo.tamano_bytes,
      'detalle', v_detalle_limpio,
      'timestamp', NOW()
    )
  );
END;
$$;

-- ============================================================
-- Permisos restrictivos (preservados de FASE 2 Commit 2.5)
-- ============================================================
REVOKE ALL ON FUNCTION public.registrar_evento_archivo(uuid, text, jsonb, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.registrar_evento_archivo(uuid, text, jsonb, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_evento_archivo(uuid, text, jsonb, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.registrar_evento_archivo(uuid, text, jsonb, uuid) TO service_role;

-- Tambien revocar la firma vieja (3 args) por si quedo suelta
-- Idempotente: no falla si la firma ya no existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'registrar_evento_archivo'
      AND pg_get_function_identity_arguments(p.oid)
          IN ('p_archivo_id uuid, p_evento text, p_detalle jsonb',
              'uuid, text, jsonb')
  ) THEN
    EXECUTE 'REVOKE ALL ON FUNCTION public.registrar_evento_archivo(uuid, text, jsonb) FROM PUBLIC';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.registrar_evento_archivo(uuid, text, jsonb) FROM authenticated';
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.registrar_evento_archivo(uuid, text, jsonb) FROM anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.registrar_evento_archivo(uuid, text, jsonb) TO service_role';
  END IF;
END;
$$;

COMMENT ON FUNCTION public.registrar_evento_archivo(uuid, text, jsonb, uuid) IS
  'F7-36 FASE 5: Registra eventos de archivos clinicos (FILE_UPLOAD, '
  'FILE_DOWNLOAD, FILE_DELETE, FILE_RESTORE) en audit_log con identidad '
  'real del actor. SECURITY DEFINER con search_path vacio. '
  'Permisos: SOLO service_role (Edge Functions r2-*). '
  'Parametro p_user_id (FASE 5): permite a las Edge Functions pasar el '
  'user_id real del usuario autenticado (extraido del JWT). Si es NULL, '
  'cae a auth.uid() (backward compatible). '
  'new_data contiene SOLO: evento, paciente_id, categoria, tamano_bytes, '
  'detalle (limpio de PHI), timestamp. NO almacena nombre_archivo ni '
  'r2_object_key (FASE 4). Trazabilidad via JOIN con archivos_clinicos.';

-- ============================================================
-- VERIFICACION (ejecutar manualmente despues de aplicar)
-- ============================================================
--
-- Query 1: Confirmar firma con 4 args y permisos
--
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS args_signature,
       p.proconfig AS config,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_can_exec,
       has_function_privilege('public', p.oid, 'EXECUTE') AS public_can_exec,
       has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_can_exec
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'registrar_evento_archivo';
--
-- Esperado (1 fila):
--   args_signature = p_archivo_id uuid, p_evento text, p_detalle jsonb, p_user_id uuid
--   config = {search_path=}
--   auth_can_exec = false
--   public_can_exec = false
--   service_can_exec = true
--
-- Query 2: Test obligatorio del brief (subir archivo como usuario real)
--
SELECT action, user_id, created_at
FROM public.audit_log
WHERE action = 'FILE_UPLOAD'
ORDER BY created_at DESC
LIMIT 1;
--
-- Esperado: user_id = UUID del usuario autenticado (NO null)
