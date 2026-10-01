-- ============================================================
-- Seed de DESARROLLO (entorno local)
-- Datos mínimos para desarrollo: 1 clínica + 4 roles
-- NO contiene PHI real. Usar solo en desarrollo.
-- ============================================================

-- Clínica de desarrollo
INSERT INTO clinicas (id, nombre)
VALUES ('00000000-0000-0000-0000-000000000001', 'Clínica Dev')
ON CONFLICT (id) DO NOTHING;
