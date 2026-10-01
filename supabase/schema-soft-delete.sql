-- schema-soft-delete.sql — F6-Fa
-- Versionar esquema de soft delete de pacientes.
--
-- CONTEXTO: F6-F (2026-08-22) implementó soft delete pero nunca versionó el
-- esquema SQL en supabase/. Las políticas pacientes_*_clinica de F6-C-c
-- fueron sobrescritas manualmente en Supabase por 3 políticas nuevas con
-- soporte de deleted_at, sin respaldo en el repo. Este script versiona ese
-- esquema para que un proyecto Supabase vacío ejecutando los scripts del
-- repo quede funcionalmente equivalente al entorno de desarrollo.
--
-- ALCANCE:
-- 1. Agrega columna deleted_at a pacientes (si no existe).
-- 2. Crea índices para consultas eficientes (soft delete).
-- 3. Reemplaza políticas pacientes_*_clinica de F6-C-c por las 3 nuevas.
-- 4. Mantiene pacientes_insert_clinica intacta (ya idempotente, no se toca).
--
-- IDEMPOTENCIA: todas las operaciones son IF EXISTS / IF NOT EXISTS o
-- DROP + CREATE. El script puede ejecutarse N veces sin error ni pérdida
-- de datos.
--
-- DEPENDENCIAS: schema-multiclinica-rls.sql (crea tabla pacientes e índices
-- base). Ejecutar DESPUÉS de ese script.
--
-- Ley 20.584 art. 15: la ficha clínica nunca se destruye, se archiva.

BEGIN;

-- ============================================================
-- 1. DDL: columna deleted_at + índices
-- ============================================================

ALTER TABLE pacientes
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

COMMENT ON COLUMN pacientes.deleted_at IS
  'F6-F: marca de soft delete. NULL = activo; timestamp = eliminado el...';

CREATE INDEX IF NOT EXISTS idx_pacientes_deleted_at
  ON pacientes(deleted_at);

CREATE INDEX IF NOT EXISTS idx_pacientes_activos
  ON pacientes(clinica_id)
  WHERE deleted_at IS NULL;

-- ============================================================
-- 2. Limpieza idempotente de políticas
-- ============================================================

-- Políticas obsoletas de F6-C-c (schema-multiclinica-rls.sql):
DROP POLICY IF EXISTS pacientes_select_clinica ON pacientes;
DROP POLICY IF EXISTS pacientes_update_clinica ON pacientes;
DROP POLICY IF EXISTS pacientes_delete_clinica ON pacientes;

-- Políticas nuevas (por si se re-ejecuta el script):
DROP POLICY IF EXISTS pacientes_select_activos ON pacientes;
DROP POLICY IF EXISTS pacientes_select_admin_todos ON pacientes;
DROP POLICY IF EXISTS pacientes_update_activos ON pacientes;

-- NOTA: pacientes_insert_clinica NO se toca. Ya existe y es idempotente.

-- ============================================================
-- 3. Crear políticas con soporte de soft delete
-- ============================================================

-- 3.1 SELECT: solo pacientes activos (todos los authenticated)
-- Un usuario normal de la clínica solo ve pacientes no eliminados.
CREATE POLICY pacientes_select_activos ON pacientes FOR SELECT
  TO authenticated
  USING (
    clinica_id = clinica_actual()
    AND deleted_at IS NULL
  );

-- 3.2 SELECT: todos los pacientes (solo admin de la clínica actual)
-- El admin puede ver activos + eliminados para la papelera (F6-L).
CREATE POLICY pacientes_select_admin_todos ON pacientes FOR SELECT
  TO authenticated
  USING (
    clinica_id = clinica_actual()
    AND es_admin_de_clinica_actual()
  );

-- 3.3 UPDATE: normal para pacientes activos + restauración solo por admin
-- - Usuario normal: puede UPDATE solo si deleted_at IS NULL.
-- - Admin: puede UPDATE aunque deleted_at IS NOT NULL (restauración).
-- - El WITH CHECK solo valida clinica_id (no bloquea restauración).
CREATE POLICY pacientes_update_activos ON pacientes FOR UPDATE
  TO public
  USING (
    clinica_id = clinica_actual()
    AND (deleted_at IS NULL OR es_admin_de_clinica_actual())
  )
  WITH CHECK (clinica_id = clinica_actual());

-- NOTA: no se crea política de DELETE físico. Con RLS activo y sin
-- política de DELETE, NADIE puede borrar pacientes permanentemente.
-- Esto cumple la Ley 20.584 art. 15.

COMMIT;
