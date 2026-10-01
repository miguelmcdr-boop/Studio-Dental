-- ============================================================
-- F7-32: Agregar AUTO_PURGE_ARCHIVOS al CHECK de audit_log
-- ============================================================
--
-- PROBLEMA: El constraint audit_log_action_check no incluía
-- AUTO_PURGE_ARCHIVOS, causando silent fail al registrar el
-- evento desde archivos-purge en modo interno.
--
-- SOLUCIÓN: Reemplazar el constraint con la nueva acción incluida.
-- ============================================================

-- 1. Eliminar constraint anterior
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_action_check;

-- 2. Crear nuevo constraint con AUTO_PURGE_ARCHIVOS incluido
ALTER TABLE audit_log ADD CONSTRAINT audit_log_action_check CHECK (
  action IN (
    'INSERT',
    'UPDATE',
    'DELETE',
    'CONFLICT_RESOLVED',
    'FILE_UPLOAD',
    'FILE_DOWNLOAD',
    'FILE_DELETE',
    'FILE_RESTORE',
    'EXPORT',
    'ADMIN_PURGE_PACIENTES',
    'ADMIN_PURGE_ARCHIVOS',
    'AUTO_PURGE_ARCHIVOS'  -- F7-32: nuevo evento del cron
  )
);

COMMENT ON CONSTRAINT audit_log_action_check ON audit_log IS 
  'Lista blanca de acciones auditables. F7-32 agrega AUTO_PURGE_ARCHIVOS '
  'para trazabilidad de la purga automática de archivos expirados.';
