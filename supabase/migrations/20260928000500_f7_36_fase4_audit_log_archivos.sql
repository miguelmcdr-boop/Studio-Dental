-- ============================================================
-- F7-36 FASE 4 (Commit 4.1): Limpiar PHI de audit_log en
-- registrar_evento_archivo
-- ============================================================
--
-- OBJETIVO:
-- Reescribir registrar_evento_archivo para que new_data
-- contenga SOLO información necesaria para trazabilidad,
-- eliminando campos con PHI potencial.
--
-- PROBLEMA DETECTADO (auditoría de datos reales en staging):
-- La función actual lee nombre_archivo desde archivos_clinicos
-- y lo inserta en new_data, exponiendo potencialmente PHI:
--   "nombre_archivo": "consentimiento_Pepito_Perez_RUT.pdf"
-- Esto viola el principio del brief F7-36 FASE 4:
--   "Evitar almacenar innecesariamente: nombre completo del
--    paciente, RUT, nombre de archivo potencialmente
--    identificable, contenido clínico, URLs firmadas,
--    object keys sensibles, JWT, Authorization headers,
--    secretos."
--
-- DECISIONES (confirmadas):
-- 1. ELIMINAR nombre_archivo de new_data (Opción A)
--    Trazabilidad preservada vía JOIN con archivos_clinicos
--    cuando se necesite auditar.
-- 2. NO tocar datos históricos (audit_log es append-only)
-- 3. NO tocar user_id = null (delegado a FASE 5: identidad
--    real del actor)
--
-- CAMBIOS:
-- - ELIMINAR: nombre_archivo de new_data
-- - ELIMINAR: estado de new_data (redundante, está en
--   archivos_clinicos)
-- - CONSERVAR: evento, paciente_id, categoria, tamano_bytes,
--   timestamp, detalle (sin duplicados top-level)
-- - AGREGAR: SET search_path = '' (alineado con FASE 3)
-- - MANTENER: permisos de FASE 2 (REVOKE PUBLIC/auth/anon,
--   GRANT service_role)
--
-- PRINCIPIO CONSERVADOR (del brief):
-- "NO eliminar información necesaria para auditoría sin
--  reemplazar su trazabilidad."
--
-- Reemplazo de trazabilidad: el auditor puede reconstruir
-- el nombre_archivo vía JOIN:
--
--   SELECT al.created_at, al.action, al.user_id,
--          a.nombre_archivo, a.categoria, a.tamano_bytes
--   FROM audit_log al
--   JOIN archivos_clinicos a ON a.id = al.record_id::uuid
--   WHERE al.action = 'FILE_UPLOAD'
--   ORDER BY al.created_at DESC LIMIT 10;
--
-- TEST OBLIGATORIO (post-aplicación):
-- Subir un archivo en la app, luego ejecutar:
--
--   SELECT action, new_data
--   FROM audit_log
--   WHERE action = 'FILE_UPLOAD'
--   ORDER BY created_at DESC LIMIT 1;
--
-- Esperado: new_data SIN "nombre_archivo" ni "r2_object_key".
-- ============================================================

-- ============================================================
-- Reescribir registrar_evento_archivo
-- ============================================================
CREATE OR REPLACE FUNCTION public.registrar_evento_archivo(
  p_archivo_id uuid,
  p_evento text,
  p_detalle jsonb DEFAULT '{}'::jsonb
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
  -- Obtener datos mínimos del archivo (sin nombre_archivo)
  SELECT clinica_id, paciente_id, categoria, tamano_bytes
  INTO v_archivo
  FROM public.archivos_clinicos
  WHERE id = p_archivo_id;

  IF v_archivo IS NULL THEN
    RAISE EXCEPTION 'Archivo no encontrado: %', p_archivo_id;
  END IF;

  -- Limpiar el detalle: quitar duplicados que ya están top-level
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
    auth.uid(),
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
REVOKE ALL ON FUNCTION public.registrar_evento_archivo(uuid, text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.registrar_evento_archivo(uuid, text, jsonb) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_evento_archivo(uuid, text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.registrar_evento_archivo(uuid, text, jsonb) TO service_role;

COMMENT ON FUNCTION public.registrar_evento_archivo(uuid, text, jsonb) IS
  'F7-36 FASE 4: Registra eventos de archivos clínicos (FILE_UPLOAD, '
  'FILE_DOWNLOAD, FILE_DELETE, FILE_RESTORE) en audit_log. '
  'SECURITY DEFINER con search_path vacío. '
  'Permisos: SOLO service_role (Edge Functions r2-*). '
  'new_data contiene SOLO: evento, paciente_id, categoria, tamano_bytes, '
  'detalle (limpio), timestamp. NO almacena nombre_archivo ni r2_object_key '
  '(PHI potencial). Trazabilidad vía JOIN con archivos_clinicos.';

-- ============================================================
-- VERIFICACIÓN (ejecutar manualmente después de aplicar)
-- ============================================================
--
-- Query 1: Confirmar search_path vacío y permisos
--
SELECT p.proname,
       p.proconfig AS config,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_can_exec,
       has_function_privilege('public', p.oid, 'EXECUTE') AS public_can_exec,
       has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_can_exec
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'registrar_evento_archivo';
--
-- Esperado:
--   config = {search_path=}
--   auth_can_exec = false
--   public_can_exec = false
--   service_can_exec = true
--
-- Query 2: Test obligatorio del brief (subir archivo en la app)
--
SELECT action, new_data
FROM public.audit_log
WHERE action = 'FILE_UPLOAD'
ORDER BY created_at DESC
LIMIT 1;
--
-- Esperado: new_data SIN "nombre_archivo" ni "r2_object_key"
-- Ejemplo válido:
-- {
--   "evento": "FILE_UPLOAD",
--   "paciente_id": "uuid-123",
--   "categoria": "pdf",
--   "tamano_bytes": 1024,
--   "detalle": {...},
--   "timestamp": "2026-09-28..."
-- }
--
-- Query 3: Auditor puede reconstruir nombre vía JOIN
--
SELECT al.created_at, al.action, al.user_id,
       a.nombre_archivo, a.categoria, a.tamano_bytes
FROM public.audit_log al
JOIN public.archivos_clinicos a ON a.id = al.record_id::uuid
WHERE al.action = 'FILE_UPLOAD'
ORDER BY al.created_at DESC
LIMIT 1;
--
-- Esperado: retorna fila con nombre_archivo (trazabilidad preservada)
