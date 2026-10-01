-- ============================================================
-- F7-22 Fase 6: Tabla archivos_clinicos con RLS multi-tenant
-- ============================================================
--
-- OBJETIVO:
-- Almacenar metadata de archivos clínicos pesados en Supabase,
-- mientras los archivos residen en Cloudflare R2 (infraestructura
-- validada en Fase 5: r2-health-check).
--
-- RELACIONES:
-- - clinica_id -> clinicas.id (multi-tenant isolation)
-- - paciente_id -> pacientes.id (asociación clínica)
-- - uploaded_by -> auth.users (auditoría de quién subió)
--
-- SEGURIDAD:
-- - RLS habilitado con 4 políticas (patrón F7-20)
-- - Validación: paciente_id pertenece a clinica_id del usuario
-- - Integración con audit_log para trazabilidad
-- - Soft delete con columna deleted_at
--
-- CATEGORÍAS SOPORTADAS:
-- - radiografia (panorámica, periapical, bitewing, CBCT)
-- - foto_intraoral (antes/después, estados clínicos)
-- - foto_clinica (extraoral, perfil, sonrisa)
-- - pdf (consentimientos, recetas escaneadas, documentos)
-- - documento (otros formatos: docx, xlsx, etc.)
-- - otro (categoría genérica)
-- ============================================================

-- ============================================================
-- 1. CREAR TABLA
-- ============================================================
CREATE TABLE IF NOT EXISTS archivos_clinicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Multi-tenant (obligatorio)
  clinica_id UUID NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  
  -- Asociación clínica
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  
  -- Referencia a Cloudflare R2
  r2_object_key TEXT NOT NULL,
  
  -- Metadata del archivo
  nombre_archivo TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  tamano_bytes BIGINT NOT NULL CHECK (tamano_bytes >= 0),
  categoria TEXT NOT NULL CHECK (categoria IN (
    'radiografia',
    'foto_intraoral',
    'foto_clinica',
    'pdf',
    'documento',
    'otro'
  )),
  
  -- Auditoría
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Estado (soft delete)
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN (
    'activo',
    'eliminado',
    'pendiente_revision'
  )),
  
  -- Metadata extensible por categoría
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,
  
  -- Constraints únicos
  CONSTRAINT archivos_clinicos_r2_key_unique UNIQUE (r2_object_key)
);

-- ============================================================
-- 2. ÍNDICES
-- ============================================================

-- Búsqueda por clínica (consultas multi-tenant)
CREATE INDEX IF NOT EXISTS archivos_clinicos_clinica_idx
  ON archivos_clinicos(clinica_id);

-- Búsqueda por paciente (ficha clínica)
CREATE INDEX IF NOT EXISTS archivos_clinicos_paciente_idx
  ON archivos_clinicos(paciente_id);

-- Filtrado por categoría
CREATE INDEX IF NOT EXISTS archivos_clinicos_categoria_idx
  ON archivos_clinicos(categoria);

-- Filtrado por estado (excluir eliminados)
CREATE INDEX IF NOT EXISTS archivos_clinicos_estado_idx
  ON archivos_clinicos(estado);

-- Búsqueda por fecha de creación (timeline)
CREATE INDEX IF NOT EXISTS archivos_clinicos_created_at_idx
  ON archivos_clinicos(created_at DESC);

-- Búsqueda por usuario que subió
CREATE INDEX IF NOT EXISTS archivos_clinicos_uploaded_by_idx
  ON archivos_clinicos(uploaded_by);

-- Búsqueda por r2_object_key (para validar unicidad y lookup)
CREATE INDEX IF NOT EXISTS archivos_clinicos_r2_object_key_idx
  ON archivos_clinicos(r2_object_key);

-- Índice compuesto para queries comunes (clínica + paciente + estado activo)
CREATE INDEX IF NOT EXISTS archivos_clinicos_clinica_paciente_activo_idx
  ON archivos_clinicos(clinica_id, paciente_id, estado)
  WHERE estado = 'activo';

-- ============================================================
-- 3. TRIGGER PARA updated_at AUTOMÁTICO
-- ============================================================
CREATE OR REPLACE FUNCTION archivos_clinicos_updated_at_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS archivos_clinicos_updated_at_trigger ON archivos_clinicos;
CREATE TRIGGER archivos_clinicos_updated_at_trigger
  BEFORE UPDATE ON archivos_clinicos
  FOR EACH ROW
  EXECUTE FUNCTION archivos_clinicos_updated_at_trigger();

-- ============================================================
-- 4. HABILITAR RLS
-- ============================================================
ALTER TABLE archivos_clinicos ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. POLÍTICAS RLS (patrón F7-20 multiclinica)
-- ============================================================

-- SELECT: cualquier rol clínico puede ver archivos de su clínica
CREATE POLICY archivos_clinicos_select_clinica ON archivos_clinicos FOR SELECT
  USING (
    paciente_id IN (
      SELECT id FROM pacientes 
      WHERE clinica_id = clinica_actual()
    )
    AND tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[])
  );

-- INSERT: solo admin/dentista puede subir archivos
CREATE POLICY archivos_clinicos_insert_clinica ON archivos_clinicos FOR INSERT
  WITH CHECK (
    paciente_id IN (
      SELECT id FROM pacientes 
      WHERE clinica_id = clinica_actual()
    )
    AND clinica_id = clinica_actual()
    AND uploaded_by = auth.uid()
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

-- UPDATE: solo admin/dentista puede actualizar metadata
CREATE POLICY archivos_clinicos_update_clinica ON archivos_clinicos FOR UPDATE
  USING (
    paciente_id IN (
      SELECT id FROM pacientes 
      WHERE clinica_id = clinica_actual()
    )
    AND clinica_id = clinica_actual()
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  )
  WITH CHECK (
    paciente_id IN (
      SELECT id FROM pacientes 
      WHERE clinica_id = clinica_actual()
    )
    AND clinica_id = clinica_actual()
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

-- DELETE: solo admin/dentista puede eliminar (soft delete vía deleted_at)
CREATE POLICY archivos_clinicos_delete_clinica ON archivos_clinicos FOR DELETE
  USING (
    paciente_id IN (
      SELECT id FROM pacientes 
      WHERE clinica_id = clinica_actual()
    )
    AND clinica_id = clinica_actual()
    AND tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
  );

-- ============================================================
-- 6. FUNCIÓN PARA AUDITAR EVENTOS DE ARCHIVOS
-- ============================================================
CREATE OR REPLACE FUNCTION registrar_evento_archivo(
  p_archivo_id UUID,
  p_evento TEXT,
  p_detalle JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
DECLARE
  v_clinica_id UUID;
  v_paciente_id UUID;
BEGIN
  SELECT clinica_id, paciente_id 
  INTO v_clinica_id, v_paciente_id
  FROM archivos_clinicos
  WHERE id = p_archivo_id;
  
  IF v_clinica_id IS NULL THEN
    RAISE EXCEPTION 'Archivo no encontrado: %', p_archivo_id;
  END IF;
  
  -- Solo registrar si audit_log existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log') THEN
    INSERT INTO audit_log (
      clinica_id,
      user_id,
      action,
      resource_type,
      resource_id,
      details
    ) VALUES (
      v_clinica_id,
      auth.uid(),
      p_evento,
      'archivo_clinico',
      p_archivo_id,
      p_detalle || jsonb_build_object(
        'paciente_id', v_paciente_id,
        'timestamp', NOW()
      )
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================
COMMENT ON TABLE archivos_clinicos IS 
  'F7-22: Metadata de archivos clínicos almacenados en Cloudflare R2. '
  'Multi-tenant aislado por clinica_id. Integrado con audit_log. '
  'Soft delete vía columna deleted_at.';

COMMENT ON COLUMN archivos_clinicos.r2_object_key IS 
  'Path del archivo en Cloudflare R2. Ejemplo: clinica_id/paciente_id/uuid-nombre.ext. '
  'Nunca exponer como URL pública. Siempre usar URLs firmadas vía Edge Function.';

COMMENT ON COLUMN archivos_clinicos.categoria IS 
  'Categoría clínica: radiografia, foto_intraoral, foto_clinica, pdf, documento, otro';

COMMENT ON COLUMN archivos_clinicos.estado IS 
  'Estado del archivo: activo (visible), eliminado (soft-deleted), pendiente_revision';

COMMENT ON COLUMN archivos_clinicos.metadata IS 
  'Metadata extensible por categoría. Ejemplo para radiografia: '
  '{"tipo": "panoramica", "fecha_toma": "2026-09-02", "notas": "..."}';

COMMENT ON FUNCTION registrar_evento_archivo IS 
  'Registra eventos de archivos clínicos en audit_log: upload, download, view, delete';

-- ============================================================
-- 8. VERIFICACIÓN (queries de diagnóstico post-migración)
-- ============================================================
-- Las siguientes queries se usarán para validar:
-- SELECT COUNT(*) FROM archivos_clinicos; -- debe ser 0 inicialmente
-- SELECT policyname FROM pg_policies WHERE tablename = 'archivos_clinicos';
-- SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'archivos_clinicos';
