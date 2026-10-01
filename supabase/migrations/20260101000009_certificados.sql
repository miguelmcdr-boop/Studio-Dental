-- ============================================================
-- F6-O: Tabla de certificados médicos
-- Depende de: schema-multiclinica-base.sql (clinicas, miembros_clinica)
-- Ejecutar después de: schema.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS certificados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE NOT NULL,
  fecha_emision DATE NOT NULL,
  tipo TEXT NOT NULL,
  datos JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS certificados_paciente_id_idx ON certificados(paciente_id);
CREATE INDEX IF NOT EXISTS certificados_clinica_id_idx ON certificados(clinica_id);
CREATE INDEX IF NOT EXISTS certificados_user_id_idx ON certificados(user_id);
CREATE INDEX IF NOT EXISTS certificados_fecha_emision_idx ON certificados(fecha_emision);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_certificados_updated_at
  BEFORE UPDATE ON certificados
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE certificados ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (F6-C multi-clínica)
-- Solo miembros de la clínica pueden ver certificados de sus pacientes

-- SELECT: miembros de la clínica pueden ver certificados
DROP POLICY IF EXISTS "certificados_select_clinica" ON certificados;
CREATE POLICY "certificados_select_clinica" ON certificados
  FOR SELECT
  USING (
    clinica_id IN (
      SELECT clinica_id FROM miembros_clinica
      WHERE user_id = auth.uid() AND activo = true
    )
  );

-- INSERT: solo miembros pueden crear certificados
DROP POLICY IF EXISTS "certificados_insert_clinica" ON certificados;
CREATE POLICY "certificados_insert_clinica" ON certificados
  FOR INSERT
  WITH CHECK (
    clinica_id IN (
      SELECT clinica_id FROM miembros_clinica
      WHERE user_id = auth.uid() AND activo = true
    )
  );

-- UPDATE: solo el creador o admin pueden actualizar
DROP POLICY IF EXISTS "certificados_update_propio" ON certificados;
CREATE POLICY "certificados_update_propio" ON certificados
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM miembros_clinica
      WHERE user_id = auth.uid() AND clinica_id = certificados.clinica_id AND rol = 'admin'
    )
  );

-- DELETE: solo admin pueden eliminar
DROP POLICY IF EXISTS "certificados_delete_admin" ON certificados;
CREATE POLICY "certificados_delete_admin" ON certificados
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM miembros_clinica
      WHERE user_id = auth.uid() AND clinica_id = certificados.clinica_id AND rol = 'admin'
    )
  );
