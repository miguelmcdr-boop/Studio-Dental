-- ============================================================
-- F7-31: Agregar FILE_RESTORE al constraint de audit_log.action
-- ============================================================
--
-- PROBLEMA: La migración 13 añadió FILE_UPLOAD, FILE_DOWNLOAD, FILE_DELETE
-- al constraint de audit_log.action, pero no incluyó FILE_RESTORE.
-- La Edge Function r2-restore intenta registrar FILE_RESTORE y falla
-- silenciosamente porque el INSERT viola el CHECK constraint.
--
-- SOLUCIÓN: Ampliar el constraint para incluir FILE_RESTORE.
-- ============================================================

-- 1. Eliminar constraint actual
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_action_check;

-- 2. Crear nuevo constraint con FILE_RESTORE incluido
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
    'EXPORT'::text
  ));

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'audit_log'::regclass 
--   AND contype = 'c';
