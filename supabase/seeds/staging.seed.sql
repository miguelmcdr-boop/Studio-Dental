-- ============================================================
-- Seed de STAGING
-- 2 clínicas + usuarios E2E para pruebas de aislamiento
-- NO contiene PHI real. Usar solo en staging.
-- ============================================================

-- Clínicas de staging
INSERT INTO clinicas (id, nombre)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Clínica Studio Dental'),
  ('00000000-0000-0000-0000-000000000002', 'Clínica E2E Secundaria')
ON CONFLICT (id) DO NOTHING;
