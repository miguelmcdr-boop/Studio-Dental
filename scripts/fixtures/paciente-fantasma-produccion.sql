-- ============================================================================
-- F7-34: Paciente fantasma para validacion en PRODUCCION
-- Clinica: E2E Secundaria (00000000-0000-0000-0000-000000000002)
-- user_id: se toma del admin activo de esa clinica via subselect
-- Ejecutar en SQL Editor de produccion (nagduvivilmzupdpoayo)
-- ============================================================================
BEGIN;

INSERT INTO public.pacientes (
  id, user_id, clinica_id, nombre, rut, rut_normalizado,
  telefono, email, prevision, motivo_consulta, alergias, enfermedades,
  fecha_ingreso, created_at, updated_at, deleted_at
)
SELECT
  '99999999-9999-9999-9999-999999999999',
  m.user_id,
  '00000000-0000-0000-0000-000000000002',
  'ZZ PRUEBA F7-34 NO ATENDER',
  '99.999.999-9',
  '999999999',
  '+56900000000',
  'prueba-f7-34@studio-dental.test',
  'Particular',
  'PACIENTE SINTETICO PARA VALIDACION F7-34',
  'PACIENTE SINTETICO',
  'PACIENTE SINTETICO',
  NOW(), NOW(), NOW(), NULL
FROM public.miembros_clinica m
WHERE m.clinica_id = '00000000-0000-0000-0000-000000000002'
  AND m.rol = 'admin'
  AND m.activo = true
LIMIT 1
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Verificacion:
-- SELECT id, nombre, clinica_id::text, left(user_id::text,4) FROM public.pacientes
-- WHERE id = '99999999-9999-9999-9999-999999999999';

-- Limpieza post-validacion (ejecutar manualmente al cerrar F7-34):
-- DELETE FROM public.pacientes WHERE id = '99999999-9999-9999-9999-999999999999';
