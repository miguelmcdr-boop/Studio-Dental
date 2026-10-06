-- =============================================================================
-- HOTFIX D: Limpieza de políticas RLS duplicadas en tabla pacientes
-- Ejecutar manualmente en Supabase SQL Editor
-- =============================================================================

-- PASO 1: Eliminar políticas duplicadas
DROP POLICY IF EXISTS pacientes_select_clinica ON pacientes;
DROP POLICY IF EXISTS pacientes_select_admin_todos ON pacientes;

-- PASO 2: Corregir roles en update_activos (public → authenticated)
DROP POLICY IF EXISTS pacientes_update_activos ON pacientes;

CREATE POLICY pacientes_update_activos
ON pacientes
FOR UPDATE
TO authenticated
USING (
  clinica_id = clinica_actual()
  AND (deleted_at IS NULL OR es_admin_de_clinica_actual())
)
WITH CHECK (
  clinica_id = clinica_actual()
);

-- PASO 3: Recargar schema cache de PostgREST
NOTIFY pgrst, 'reload schema';

-- PASO 4: Verificar políticas finales
SELECT 
  policyname,
  cmd,
  roles,
  LEFT(qual, 100) as qual_resumen
FROM pg_policies
WHERE tablename = 'pacientes'
ORDER BY policyname;
