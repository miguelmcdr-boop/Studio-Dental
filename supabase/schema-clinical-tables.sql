-- ============================================================
-- Studio Dental - Tablas clínicas adicionales (F4-02c-1)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- Complementa schema.sql de F4-02a
-- ============================================================

-- ============================================================
-- TABLA: evoluciones_clinicas (notas de bitácora por paciente)
-- ============================================================
CREATE TABLE IF NOT EXISTS evoluciones_clinicas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  fecha_hora TEXT NOT NULL,
  texto TEXT NOT NULL,
  tipo TEXT DEFAULT 'evolucion',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: recetas (recetas médicas por paciente)
-- ============================================================
CREATE TABLE IF NOT EXISTS recetas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  fecha DATE NOT NULL,
  medicamentos JSONB NOT NULL,
  diagnostico TEXT,
  indicaciones TEXT,
  firma TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: odontogramas (inicial + evolución por paciente)
-- ============================================================
CREATE TABLE IF NOT EXISTS odontogramas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT CHECK (tipo IN ('inicial', 'evolucion')) NOT NULL,
  datos JSONB NOT NULL,
  fecha_registro DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: periodontogramas (datos periodontales por paciente)
-- ============================================================
CREATE TABLE IF NOT EXISTS periodontogramas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT CHECK (tipo IN ('inicial', 'control')) NOT NULL DEFAULT 'inicial',
  datos JSONB NOT NULL,
  fecha_registro DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: periodontogramas_historial (historial de controles)
-- ============================================================
CREATE TABLE IF NOT EXISTS periodontogramas_historial (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  controles JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: dsd_configs (diseño de sonrisa digital por paciente)
-- ============================================================
CREATE TABLE IF NOT EXISTS dsd_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: odontopediatria (datos pediátricos por paciente)
-- ============================================================
CREATE TABLE IF NOT EXISTS odontopediatria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  datos JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: quirurgico_implantes (implantes dentales por paciente)
-- ============================================================
CREATE TABLE IF NOT EXISTS quirurgico_implantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  implantes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: quirurgico_endodoncia (endodoncias por paciente)
-- ============================================================
CREATE TABLE IF NOT EXISTS quirurgico_endodoncia (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE NOT NULL,
  endodoncias JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_evoluciones_paciente_id ON evoluciones_clinicas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_evoluciones_user_id ON evoluciones_clinicas(user_id);
CREATE INDEX IF NOT EXISTS idx_recetas_paciente_id ON recetas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_recetas_user_id ON recetas(user_id);
CREATE INDEX IF NOT EXISTS idx_odontogramas_paciente_id ON odontogramas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_periodontogramas_paciente_id ON periodontogramas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_periodontogramas_historial_paciente_id ON periodontogramas_historial(paciente_id);
CREATE INDEX IF NOT EXISTS idx_dsd_configs_paciente_id ON dsd_configs(paciente_id);
CREATE INDEX IF NOT EXISTS idx_odontopediatria_paciente_id ON odontopediatria(paciente_id);
CREATE INDEX IF NOT EXISTS idx_quirurgico_implantes_paciente_id ON quirurgico_implantes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_quirurgico_endodoncia_paciente_id ON quirurgico_endodoncia(paciente_id);

-- ============================================================
-- TRIGGERS para actualizar updated_at automáticamente
-- ============================================================
CREATE TRIGGER update_evoluciones_updated_at BEFORE UPDATE ON evoluciones_clinicas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recetas_updated_at BEFORE UPDATE ON recetas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_odontogramas_updated_at BEFORE UPDATE ON odontogramas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_periodontogramas_updated_at BEFORE UPDATE ON periodontogramas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_periodontogramas_historial_updated_at BEFORE UPDATE ON periodontogramas_historial
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_dsd_configs_updated_at BEFORE UPDATE ON dsd_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_odontopediatria_updated_at BEFORE UPDATE ON odontopediatria
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quirurgico_implantes_updated_at BEFORE UPDATE ON quirurgico_implantes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quirurgico_endodoncia_updated_at BEFORE UPDATE ON quirurgico_endodoncia
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE evoluciones_clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE recetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE odontogramas ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodontogramas ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodontogramas_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE dsd_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE odontopediatria ENABLE ROW LEVEL SECURITY;
ALTER TABLE quirurgico_implantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quirurgico_endodoncia ENABLE ROW LEVEL SECURITY;

-- Políticas: cada usuario gestiona solo sus propios datos
DROP POLICY IF EXISTS "Users can manage own evoluciones" ON evoluciones_clinicas;
CREATE POLICY "Users can manage own evoluciones" ON evoluciones_clinicas
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own recetas" ON recetas;
CREATE POLICY "Users can manage own recetas" ON recetas
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own odontogramas" ON odontogramas;
CREATE POLICY "Users can manage own odontogramas" ON odontogramas
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own periodontogramas" ON periodontogramas;
CREATE POLICY "Users can manage own periodontogramas" ON periodontogramas
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own periodontogramas_historial" ON periodontogramas_historial;
CREATE POLICY "Users can manage own periodontogramas_historial" ON periodontogramas_historial
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own dsd_configs" ON dsd_configs;
CREATE POLICY "Users can manage own dsd_configs" ON dsd_configs
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own odontopediatria" ON odontopediatria;
CREATE POLICY "Users can manage own odontopediatria" ON odontopediatria
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own quirurgico_implantes" ON quirurgico_implantes;
CREATE POLICY "Users can manage own quirurgico_implantes" ON quirurgico_implantes
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own quirurgico_endodoncia" ON quirurgico_endodoncia;
CREATE POLICY "Users can manage own quirurgico_endodoncia" ON quirurgico_endodoncia
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- REALTIME - Habilitar sincronización automática
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE evoluciones_clinicas;
ALTER PUBLICATION supabase_realtime ADD TABLE recetas;
ALTER PUBLICATION supabase_realtime ADD TABLE odontogramas;
ALTER PUBLICATION supabase_realtime ADD TABLE periodontogramas;
ALTER PUBLICATION supabase_realtime ADD TABLE periodontogramas_historial;
ALTER PUBLICATION supabase_realtime ADD TABLE dsd_configs;
ALTER PUBLICATION supabase_realtime ADD TABLE odontopediatria;
ALTER PUBLICATION supabase_realtime ADD TABLE quirurgico_implantes;
ALTER PUBLICATION supabase_realtime ADD TABLE quirurgico_endodoncia;

-- ============================================================
-- VERIFICACIÓN: listar todas las tablas
-- ============================================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
