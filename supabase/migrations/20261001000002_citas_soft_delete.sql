-- ============================================================
-- 20261001000002_citas_soft_delete.sql
-- Fase: P0-1 — Soft Delete y RLS para Citas de Agenda
-- ============================================================
-- Propósito:
-- 1. Agregar columna `deleted_at` a `citas` para soft-delete clínico.
-- 2. Crear índices parciales eficientes para consultas de citas activas.
-- 3. Actualizar políticas RLS SELECT y UPDATE:
--    - SELECT activos: filtra `deleted_at IS NULL`.
--    - SELECT admin_todos: permite ver activas y eliminadas para papelera.
--    - UPDATE: preserva la matriz RBAC original en el WITH CHECK
--      (solo admin y dentista pueden soft-deletear; recepcion/asistente
--      solo pueden actualizar citas activas sin cambiar deleted_at).
-- 4. No toca la política INSERT (citas_insert_clinica permanece intacta).
-- 5. Elimina la política DELETE físico (fuerza soft-delete a nivel de DB).
-- 6. Auditoría garantizada por el trigger existente `trg_citas_audit`.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. DDL: columna deleted_at + índices optimizados
-- ============================================================

ALTER TABLE public.citas
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.citas.deleted_at IS
  'P0-1: marca de soft delete. NULL = cita activa; timestamp = eliminada el...';

-- Índice para consultas de agenda ordenadas por clínica y fecha (solo activas)
CREATE INDEX IF NOT EXISTS idx_citas_clinica_fecha_activas
ON public.citas(clinica_id, fecha)
WHERE deleted_at IS NULL;

-- Índice para consultas de papelera / auditoría (registros eliminados)
CREATE INDEX IF NOT EXISTS idx_citas_deleted_at
ON public.citas(clinica_id, deleted_at)
WHERE deleted_at IS NOT NULL;

-- ============================================================
-- 2. Limpieza idempotente de políticas RLS previas (SELECT, UPDATE, DELETE)
--    NOTA: citas_insert_clinica NO se toca, permanece 100% intacta.
-- ============================================================

DROP POLICY IF EXISTS citas_select_clinica ON public.citas;
DROP POLICY IF EXISTS citas_select_rol ON public.citas;
DROP POLICY IF EXISTS "Users can manage own citas" ON public.citas;
DROP POLICY IF EXISTS citas_select_activos ON public.citas;
DROP POLICY IF EXISTS citas_select_admin_todos ON public.citas;
DROP POLICY IF EXISTS citas_update_clinica ON public.citas;
DROP POLICY IF EXISTS citas_update_rol ON public.citas;
DROP POLICY IF EXISTS citas_update_activos ON public.citas;
DROP POLICY IF EXISTS citas_delete_clinica ON public.citas;
DROP POLICY IF EXISTS citas_delete_rol ON public.citas;

-- ============================================================
-- 3. Políticas RLS con soporte de Soft Delete y RBAC Estricto
-- ============================================================

-- 3.1 SELECT: Solo citas activas (no eliminadas) de la clínica actual
CREATE POLICY citas_select_activos ON public.citas FOR SELECT
  TO authenticated
  USING (
    clinica_id = public.clinica_actual()
    AND public.tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[])
    AND deleted_at IS NULL
  );

-- 3.2 SELECT: Todas las citas (activas + eliminadas) solo para admin de la clínica (papelera/auditoría)
CREATE POLICY citas_select_admin_todos ON public.citas FOR SELECT
  TO authenticated
  USING (
    clinica_id = public.clinica_actual()
    AND public.tiene_rol_en_clinica(ARRAY['admin']::app_role[])
  );

-- 3.3 UPDATE: Edición activa + Prevención de escalada de privilegios en Soft-Delete
-- - USING: Permite operar si la cita está activa (los 4 roles) o si es admin restaurando.
-- - WITH CHECK: 
--     * Si deleted_at IS NULL: edición normal permitida para admin, dentista, asistente, recepcion.
--     * Si deleted_at IS NOT NULL (soft-delete): permitido ÚNICAMENTE para admin o dentista
--       (preservando la regla original de DELETE que excluía a recepcion y asistente).
CREATE POLICY citas_update_activos ON public.citas FOR UPDATE
  TO authenticated
  USING (
    clinica_id = public.clinica_actual()
    AND public.tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[])
    AND (deleted_at IS NULL OR public.tiene_rol_en_clinica(ARRAY['admin']::app_role[]))
  )
  WITH CHECK (
    clinica_id = public.clinica_actual()
    AND (
      -- 1) Actualización normal de cita activa (todos los roles de agenda)
      (
        deleted_at IS NULL
        AND public.tiene_rol_en_clinica(ARRAY['admin','dentista','asistente','recepcion']::app_role[])
      )
      OR
      -- 2) Soft-delete (solo admin o dentista, idéntico a política DELETE original)
      (
        deleted_at IS NOT NULL
        AND public.tiene_rol_en_clinica(ARRAY['admin','dentista']::app_role[])
      )
    )
  );

-- NOTA ARQUITECTÓNICA SOBRE DELETE:
-- No se crea política de DELETE físico para citas. Al no existir política DELETE
-- en una tabla con RLS habilitado, las operaciones `DELETE FROM citas` son
-- rechazadas por PostgreSQL para cualquier rol autenticado, forzando que toda
-- eliminación se realice exclusivamente mediante soft-delete (UPDATE con deleted_at).

-- NOTA ARQUITECTÓNICA SOBRE AUDITORÍA:
-- La tabla `citas` ya cuenta con el trigger `trg_citas_audit` (migración 20260101000020),
-- el cual ejecuta `public.auditar_cambio()` AFTER UPDATE registrando automáticamente
-- en `audit_log` el user_id, clinica_id, old_data y new_data con acción 'UPDATE'.
-- Esto respeta estrictamente el constraint `audit_log_action_check`.

COMMIT;
