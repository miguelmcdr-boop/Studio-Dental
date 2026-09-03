-- ============================================================
-- F7-22: Corregir función de auditoría para archivos_clinicos
-- ============================================================
--
-- PROBLEMA: La función registrar_evento_archivo estaba intentando
-- escribir en columnas que no existen en audit_log (resource_type,
-- resource_id, details). Las columnas reales son: table_name,
-- record_id, action, old_data, new_data.
--
-- SOLUCIÓN: Reescribir la función para usar el schema correcto.
-- ============================================================

-- Eliminar función anterior
DROP FUNCTION IF EXISTS registrar_evento_archivo(UUID, TEXT, JSONB);

-- Crear función corregida
CREATE OR REPLACE FUNCTION registrar_evento_archivo(
  p_archivo_id UUID,
  p_evento TEXT,
  p_detalle JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
DECLARE
  v_archivo RECORD;
BEGIN
  -- Obtener datos del archivo
  SELECT clinica_id, paciente_id, nombre_archivo, categoria, tamano_bytes, estado
  INTO v_archivo
  FROM archivos_clinicos
  WHERE id = p_archivo_id;
  
  IF v_archivo IS NULL THEN
    RAISE EXCEPTION 'Archivo no encontrado: %', p_archivo_id;
  END IF;
  
  -- Registrar en audit_log con columnas correctas
  INSERT INTO audit_log (
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
    p_archivo_id,
    p_evento,
    jsonb_build_object(
      'evento', p_evento,
      'paciente_id', v_archivo.paciente_id,
      'nombre_archivo', v_archivo.nombre_archivo,
      'categoria', v_archivo.categoria,
      'tamano_bytes', v_archivo.tamano_bytes,
      'estado', v_archivo.estado,
      'detalle', p_detalle,
      'timestamp', NOW()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION registrar_evento_archivo IS 
  'Registra eventos de archivos clínicos en audit_log usando schema correcto. '
  'Eventos: upload, download, delete, view. '
  'Usa columnas: table_name, record_id, action, new_data.';

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_name = 'registrar_evento_archivo';
