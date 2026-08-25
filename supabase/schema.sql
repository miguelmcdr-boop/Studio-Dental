-- ============================================================
-- Studio Dental - Schema de Supabase (F4-02a)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLA: profiles (extiende auth.users)
-- ============================================================
-- ENUM app_role: fuente de verdad server-side del rol
-- (F6-B7: movido aquí para que profiles pueda usarlo)
-- Espejo de src/constants/rbacConstants.js ROLES
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('admin', 'dentista', 'asistente', 'recepcion');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role app_role DEFAULT 'recepcion',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: pacientes
-- ============================================================
CREATE TABLE IF NOT EXISTS pacientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  nombre TEXT NOT NULL,
  rut TEXT NOT NULL,
  telefono TEXT,
  edad TEXT,
  prevision TEXT,
  email TEXT,
  direccion TEXT,
  ocupacion TEXT,
  contacto_emergencia TEXT,
  peso TEXT,
  alergias TEXT,
  enfermedades TEXT,
  medicamentos TEXT,
  habitos TEXT,
  examen_extraoral TEXT,
  examen_intraoral TEXT,
  presion_arterial TEXT,
  riesgo_cariogenico TEXT,
  riesgo_periodontal TEXT,
  motivo_consulta TEXT,
  anamnesis_proxima TEXT,
  fecha_ingreso TIMESTAMPTZ DEFAULT NOW(),
  notas TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: citas
-- ============================================================
CREATE TABLE IF NOT EXISTS citas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
  paciente_nombre TEXT,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME,
  estado TEXT CHECK (estado IN ('Agendada', 'Confirmada', 'En Curso', 'Completada', 'Cancelada', 'No Asistió')) DEFAULT 'Agendada',
  motivo TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: prestaciones (arancel)
-- ============================================================
CREATE TABLE IF NOT EXISTS prestaciones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  nombre TEXT NOT NULL,
  especialidad TEXT NOT NULL,
  precio_particular INTEGER NOT NULL,
  precio_fonasa INTEGER NOT NULL,
  codigo_fonasa TEXT,
  precio INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: presupuestos
-- ============================================================
CREATE TABLE IF NOT EXISTS presupuestos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
  folio TEXT NOT NULL,
  paciente_nombre TEXT NOT NULL,
  paciente_rut TEXT,
  fecha_emision DATE DEFAULT CURRENT_DATE,
  convenio TEXT DEFAULT 'Particular',
  monto_total INTEGER DEFAULT 0,
  monto_abonado INTEGER DEFAULT 0,
  estado TEXT CHECK (estado IN ('Emitido', 'Pendiente', 'Aprobado', 'Rechazado', 'EnTratamiento')) DEFAULT 'Emitido',
  observacion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: presupuesto_items
-- ============================================================
CREATE TABLE IF NOT EXISTS presupuesto_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  presupuesto_id UUID REFERENCES presupuestos(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
  prestacion_id UUID REFERENCES prestaciones(id),
  prestacion_nombre TEXT NOT NULL,
  valor INTEGER NOT NULL,
  convenio TEXT DEFAULT 'Particular',
  estado TEXT CHECK (estado IN ('Pendiente', 'En Proceso', 'Realizado')) DEFAULT 'Pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: movimientos_financieros
-- ============================================================
CREATE TABLE IF NOT EXISTS movimientos_financieros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  fecha DATE NOT NULL,
  tipo TEXT CHECK (tipo IN ('Ingreso', 'Egreso')) NOT NULL,
  categoria TEXT NOT NULL,
  monto INTEGER NOT NULL,
  metodo_pago TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: pagos
-- ============================================================
CREATE TABLE IF NOT EXISTS pagos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
  folio TEXT NOT NULL,
  monto INTEGER NOT NULL,
  metodo_pago TEXT NOT NULL,
  fecha DATE DEFAULT CURRENT_DATE,
  concepto TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: inventario
-- ============================================================
CREATE TABLE IF NOT EXISTS inventario (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  cantidad_actual INTEGER NOT NULL,
  cantidad_minima INTEGER DEFAULT 0,
  unidad_medida TEXT,
  fecha_vencimiento DATE,
  proveedor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_pacientes_user_id ON pacientes(user_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_rut ON pacientes(rut);
CREATE INDEX IF NOT EXISTS idx_citas_user_id ON citas(user_id);
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha);
CREATE INDEX IF NOT EXISTS idx_citas_paciente_id ON citas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_prestaciones_user_id ON prestaciones(user_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_user_id ON presupuestos(user_id);
CREATE INDEX IF NOT EXISTS idx_presupuestos_paciente_id ON presupuestos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_presupuesto_items_presupuesto_id ON presupuesto_items(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_user_id ON movimientos_financieros(user_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_financieros(fecha);
CREATE INDEX IF NOT EXISTS idx_pagos_user_id ON pagos(user_id);
CREATE INDEX IF NOT EXISTS idx_pagos_paciente_id ON pagos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_inventario_user_id ON inventario(user_id);

-- ============================================================
-- TRIGGER para actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pacientes_updated_at BEFORE UPDATE ON pacientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_citas_updated_at BEFORE UPDATE ON citas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prestaciones_updated_at BEFORE UPDATE ON prestaciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_presupuestos_updated_at BEFORE UPDATE ON presupuestos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_presupuesto_items_updated_at BEFORE UPDATE ON presupuesto_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_movimientos_updated_at BEFORE UPDATE ON movimientos_financieros
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pagos_updated_at BEFORE UPDATE ON pagos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventario_updated_at BEFORE UPDATE ON inventario
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Protección de datos por usuario
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuesto_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_financieros ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para pacientes
DROP POLICY IF EXISTS "Users can view own pacientes" ON pacientes;
CREATE POLICY "Users can view own pacientes" ON pacientes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own pacientes" ON pacientes;
CREATE POLICY "Users can insert own pacientes" ON pacientes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own pacientes" ON pacientes;
CREATE POLICY "Users can update own pacientes" ON pacientes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own pacientes" ON pacientes;
CREATE POLICY "Users can delete own pacientes" ON pacientes
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para citas
DROP POLICY IF EXISTS "Users can manage own citas" ON citas;
CREATE POLICY "Users can manage own citas" ON citas
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para prestaciones
DROP POLICY IF EXISTS "Users can manage own prestaciones" ON prestaciones;
CREATE POLICY "Users can manage own prestaciones" ON prestaciones
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para presupuestos
DROP POLICY IF EXISTS "Users can manage own presupuestos" ON presupuestos;
CREATE POLICY "Users can manage own presupuestos" ON presupuestos
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para presupuesto_items (verificación vía presupuesto padre)
DROP POLICY IF EXISTS "Users can manage own presupuesto_items" ON presupuesto_items;
CREATE POLICY "Users can manage own presupuesto_items" ON presupuesto_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM presupuestos
      WHERE presupuestos.id = presupuesto_items.presupuesto_id
      AND presupuestos.user_id = auth.uid()
    )
  );

-- Políticas para movimientos_financieros
DROP POLICY IF EXISTS "Users can manage own movimientos" ON movimientos_financieros;
CREATE POLICY "Users can manage own movimientos" ON movimientos_financieros
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para pagos
DROP POLICY IF EXISTS "Users can manage own pagos" ON pagos;
CREATE POLICY "Users can manage own pagos" ON pagos
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para inventario
DROP POLICY IF EXISTS "Users can manage own inventario" ON inventario;
CREATE POLICY "Users can manage own inventario" ON inventario
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- REALTIME - Habilitar sincronización automática
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE pacientes;
ALTER PUBLICATION supabase_realtime ADD TABLE citas;
ALTER PUBLICATION supabase_realtime ADD TABLE prestaciones;
ALTER PUBLICATION supabase_realtime ADD TABLE presupuestos;
ALTER PUBLICATION supabase_realtime ADD TABLE presupuesto_items;
ALTER PUBLICATION supabase_realtime ADD TABLE movimientos_financieros;
ALTER PUBLICATION supabase_realtime ADD TABLE pagos;
ALTER PUBLICATION supabase_realtime ADD TABLE inventario;

-- ============================================================
-- VERIFICACIÓN: listar tablas creadas
-- ============================================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;