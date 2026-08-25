-- ============================================================
-- F6-O: Migración para crear tabla certificados
-- Ejecutar en: SQL Editor de Supabase
-- Idempotente: puede ejecutarse múltiples veces sin error
-- ============================================================

-- Verificar si la tabla ya existe
DO $$
DECLARE
  tabla_existe BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'certificados'
  ) INTO tabla_existe;

  IF tabla_existe THEN
    RAISE NOTICE 'Tabla certificados ya existe, omitiendo creación';
  ELSE
    RAISE NOTICE 'Creando tabla certificados...';
    
    -- Crear tabla
    CREATE TABLE certificados (
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

    -- Crear índices
    CREATE INDEX certificados_paciente_id_idx ON certificados(paciente_id);
    CREATE INDEX certificados_clinica_id_idx ON certificados(clinica_id);
    CREATE INDEX certificados_user_id_idx ON certificados(user_id);
    CREATE INDEX certificados_fecha_emision_idx ON certificados(fecha_emision);

    -- Crear trigger
    CREATE TRIGGER update_certificados_updated_at
      BEFORE UPDATE ON certificados
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    -- Habilitar RLS
    ALTER TABLE certificados ENABLE ROW LEVEL SECURITY;

    RAISE NOTICE 'Tabla certificados creada exitosamente';
  END IF;

  -- Verificar políticas RLS (crear si no existen)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'certificados' 
    AND policyname = 'certificados_select_clinica'
  ) THEN
    RAISE NOTICE 'Creando políticas RLS...';
    
    CREATE POLICY "certificados_select_clinica" ON certificados
      FOR SELECT
      USING (
        clinica_id IN (
          SELECT clinica_id FROM miembros_clinica
          WHERE user_id = auth.uid() AND activo = true
        )
      );

    CREATE POLICY "certificados_insert_clinica" ON certificados
      FOR INSERT
      WITH CHECK (
        clinica_id IN (
          SELECT clinica_id FROM miembros_clinica
          WHERE user_id = auth.uid() AND activo = true
        )
      );

    CREATE POLICY "certificados_update_propio" ON certificados
      FOR UPDATE
      USING (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM miembros_clinica
          WHERE user_id = auth.uid() AND clinica_id = certificados.clinica_id AND rol = 'admin'
        )
      );

    CREATE POLICY "certificados_delete_admin" ON certificados
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM miembros_clinica
          WHERE user_id = auth.uid() AND clinica_id = certificados.clinica_id AND rol = 'admin'
        )
      );

    RAISE NOTICE 'Políticas RLS creadas exitosamente';
  ELSE
    RAISE NOTICE 'Políticas RLS ya existen, omitiendo creación';
  END IF;
END $$;

-- Verificación final
SELECT 
  'Tabla certificados' AS elemento,
  COUNT(*) AS registros,
  'Creada' AS estado
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'certificados';

SELECT 
  'Políticas RLS' AS elemento,
  COUNT(*) AS cantidad,
  'Activas' AS estado
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'certificados';
