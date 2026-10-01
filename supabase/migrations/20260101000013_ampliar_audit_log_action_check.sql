-- ============================================================
-- F7-22: Ampliar constraint de action en audit_log
-- ============================================================
--
-- PROBLEMA: La constraint audit_log_action_check solo aceptaba
-- INSERT, UPDATE, DELETE, CONFLICT_RESOLVED, EXPORT.
-- Las Edge Functions de F7-22 necesitan registrar acciones
-- específicas de archivos clínicos.
--
-- SOLUCIÓN: Ampliar la constraint con valores FILE_* para
-- mantener consistencia con el patrón existente (mayúsculas).
-- ============================================================

-- Eliminar constraint antigua
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS audit_log_action_check;

-- Crear constraint ampliada con valores de F7-22
ALTER TABLE audit_log ADD CONSTRAINT audit_log_action_check 
CHECK ((action = ANY (ARRAY[
  'INSERT'::text,              -- triggers estándar de BD
  'UPDATE'::text,              -- triggers estándar de BD
  'DELETE'::text,              -- triggers estándar de BD
  'CONFLICT_RESOLVED'::text,   -- F7-10: resolución de conflictos
  'EXPORT'::text,              -- exportación de datos
  'FILE_UPLOAD'::text,         -- F7-22: subida de archivo clínico
  'FILE_DOWNLOAD'::text,       -- F7-22: descarga de archivo clínico
  'FILE_DELETE'::text,         -- F7-22: eliminación de archivo clínico
  'FILE_VIEW'::text            -- F7-22: visualización de archivo clínico
])));

-- Verificar que se aplicó
-- SELECT pg_get_constraintdef(oid) FROM pg_constraint 
-- WHERE conname = 'audit_log_action_check';
