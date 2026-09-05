-- ============================================================
-- Feature 1: Agregar eventos de purge al constraint de audit_log.action
-- ============================================================
--
-- PROBLEMA: Las Edge Functions de purge (pacientes-purge, archivos-purge)
-- necesitan registrar eventos de auditoría ADMIN_PURGE_PACIENTES y
-- ADMIN_PURGE_ARCHIVOS, pero el constraint actual no los incluye.
--
-- SOLUCIÓN: Ampliar el constraint audit_log_action_check para incluir
-- los nuevos eventos de purge.
-- ============================================================

-- 1. Eliminar constraint actual
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_action_check;

-- 2. Crear nuevo constraint con eventos de purge incluidos
ALTER TABLE audit_log ADD CONSTRAINT audit_log_action_check 
  CHECK (action IN (
    -- Eventos existentes (sistema general)
    'INSERT'::text,
    'UPDATE'::text,
    'DELETE'::text,
    'CONFLICT_RESOLVED'::text,
    -- Eventos F7-22: archivos clínicos
    'FILE_UPLOAD'::text,
    'FILE_DOWNLOAD'::text,
    'FILE_DELETE'::text,
    -- Eventos F7-31: papelera de archivos clínicos
    'FILE_RESTORE'::text,
    -- Eventos F7-19: exportaciones
    'EXPORT'::text,
    -- Eventos Feature 1: vaciar papeleras (eliminación permanente)
    'ADMIN_PURGE_PACIENTES'::text,
    'ADMIN_PURGE_ARCHIVOS'::text
  ));

COMMENT ON CONSTRAINT audit_log_action_check ON audit_log IS 
  'Constraint actualizado Feature 1: incluye eventos de purge permanente de papeleras';

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'audit_log'::regclass 
--   AND contype = 'c';
