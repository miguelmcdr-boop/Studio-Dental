-- ============================================================
-- Studio Dental — Vademécum Odontológico v1.1 (F6-A)
-- Esquema versionado de las 8 tablas de datos de referencia clínica
--
-- ORDEN DE EJECUCIÓN:
--   1. schema.sql                  (requerido: define update_updated_at_column())
--   2. schema-clinical-tables.sql
--   3. schema-audit-log.sql
--   4. schema-vademecum.sql        ← ESTE ARCHIVO
--   5. seed-vademecum.sql          (164 registros)
--
-- Exportado desde el proyecto Supabase de desarrollo el 2026-08-17:
-- columnas y constraints vía information_schema/pg_constraint,
-- índices vía pg_indexes, triggers vía information_schema.triggers,
-- políticas RLS vía pg_policy.
--
-- OBSERVACIÓN PARA F6-B: la tabla principal `vademecum` solo tiene
-- política de lectura pública; no tiene políticas INSERT/UPDATE/DELETE
-- para authenticated (el resto de las tablas sí). Las escrituras del
-- módulo admin sobre `vademecum` solo funcionan con service_role.
-- Se versiona tal como existe; la corrección corresponde a F6-B.
-- ============================================================

-- ============================================================
-- TABLA 1: vademecum — 94 fármacos regulares
-- Nota: es la única sin columna user_id (datos de referencia globales)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vademecum (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL UNIQUE,
  familia VARCHAR(50) NOT NULL,
  nombre_generico VARCHAR(200) NOT NULL,
  nombre_comercial VARCHAR(200),
  presentacion VARCHAR(200),
  posologia_adulto VARCHAR(500),
  posologia_pediatrica VARCHAR(500),
  dosis_max_adulto_mg INTEGER,
  dosis_max_pediatrica_mg_por_kg DOUBLE PRECISION,
  contenido_por_unidad_mg DOUBLE PRECISION,
  volumen_por_unidad_ml DOUBLE PRECISION,
  concentracion_mg_por_ml DOUBLE PRECISION,
  duracion_dias VARCHAR(100),
  contraindicaciones VARCHAR(2000),
  alergias_cruzadas JSONB DEFAULT '[]'::jsonb,
  indicaciones VARCHAR(2000),
  requiere_receta BOOLEAN DEFAULT true,
  activo BOOLEAN DEFAULT true,
  notas_especiales VARCHAR(2000),
  fuente_revision VARCHAR(200),
  fecha_revision DATE,
  curado_por VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABLA 2: vademecum_urgencia — 11 fármacos del carro de reanimación
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vademecum_urgencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  numero INTEGER NOT NULL UNIQUE,
  nombre_generico TEXT NOT NULL,
  concentracion TEXT,
  presentacion TEXT,
  indicacion TEXT NOT NULL,
  posologia_adulto TEXT,
  posologia_pediatrica TEXT,
  via_administracion TEXT,
  advertencias TEXT,
  activo BOOLEAN DEFAULT true,
  fuente_revision TEXT DEFAULT 'AHA / AAOMS / Protocolos de urgencia odontológica',
  fecha_revision DATE DEFAULT '2026-08-14',
  curado_por TEXT DEFAULT 'Miguel C. Diaz Rodriguez',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLA 3: vademecum_antirresortivos — 6 fármacos con riesgo MRONJ
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vademecum_antirresortivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  numero INTEGER NOT NULL UNIQUE,
  nombre_generico TEXT NOT NULL,
  familia TEXT NOT NULL CHECK (familia IN ('bifosfonato_oral', 'bifosfonato_iv', 'anti_rankl', 'antiangiogenico')),
  via_administracion TEXT,
  dosis_habitual TEXT,
  indicacion TEXT,
  riesgo_mronj TEXT CHECK (riesgo_mronj IN ('bajo', 'moderado', 'alto')),
  manejo_odontologico TEXT,
  activo BOOLEAN DEFAULT true,
  fuente_revision TEXT DEFAULT 'AAOMS Position Paper on MRONJ 2022',
  fecha_revision DATE DEFAULT '2026-08-14',
  curado_por TEXT DEFAULT 'Miguel C. Diaz Rodriguez',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLA 4: alergias_cruzadas — 25 reglas de reactividad cruzada
-- ============================================================
CREATE TABLE IF NOT EXISTS public.alergias_cruzadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  familia_alergia TEXT NOT NULL,
  familia_farmaco TEXT NOT NULL,
  severidad TEXT CHECK (severidad IN ('critica', 'advertencia', 'sin_relacion')),
  porcentaje_cruzado TEXT,
  nota_clinica TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (familia_alergia, familia_farmaco)
);

-- ============================================================
-- TABLA 5: interacciones_farmacologicas — 15 interacciones
-- ============================================================
CREATE TABLE IF NOT EXISTS public.interacciones_farmacologicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  farmaco_a TEXT NOT NULL,
  farmaco_b TEXT NOT NULL,
  efecto TEXT NOT NULL,
  manejo TEXT,
  severidad TEXT CHECK (severidad IN ('mayor', 'moderada', 'menor')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLA 6: profilaxis_endocarditis — 7 protocolos AHA 2021
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profilaxis_endocarditis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  situacion TEXT NOT NULL,
  farmaco TEXT NOT NULL,
  dosis_adulto TEXT,
  dosis_pediatrica TEXT,
  nota TEXT,
  activo BOOLEAN DEFAULT true,
  fuente_revision TEXT DEFAULT 'AHA Scientific Statement 2021 / ADA',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLA 7: manejo_anticoagulantes — 5 grupos perioperatorios
-- ============================================================
CREATE TABLE IF NOT EXISTS public.manejo_anticoagulantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  farmaco_o_grupo TEXT NOT NULL,
  recomendacion TEXT NOT NULL,
  medidas_hemostasia TEXT,
  activo BOOLEAN DEFAULT true,
  fuente_revision TEXT DEFAULT 'AHA/ACC, guías europeas',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLA 8: reference_data_meta — metadata de curación
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reference_data_meta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  version TEXT NOT NULL DEFAULT 'v1.1',
  curado_por TEXT NOT NULL DEFAULT 'Miguel C. Diaz Rodriguez',
  fecha_curacion DATE NOT NULL DEFAULT '2026-08-14',
  fecha_proxima_revision DATE NOT NULL DEFAULT '2027-08-14',
  fuentes TEXT[],
  total_farmacos INTEGER DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- ÍNDICES adicionales (los de PK/UNIQUE se crean con las constraints)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_vademecum_familia ON public.vademecum USING btree (familia);
CREATE INDEX IF NOT EXISTS idx_vademecum_nombre ON public.vademecum USING btree (nombre_generico);

CREATE INDEX IF NOT EXISTS idx_vademecum_urgencia_activo ON public.vademecum_urgencia USING btree (activo);
CREATE INDEX IF NOT EXISTS idx_vademecum_urgencia_indicacion ON public.vademecum_urgencia USING btree (indicacion);

CREATE INDEX IF NOT EXISTS idx_antirresortivos_familia ON public.vademecum_antirresortivos USING btree (familia);
CREATE INDEX IF NOT EXISTS idx_antirresortivos_riesgo ON public.vademecum_antirresortivos USING btree (riesgo_mronj);

CREATE INDEX IF NOT EXISTS idx_alergias_familia_alergia ON public.alergias_cruzadas USING btree (familia_alergia);
CREATE INDEX IF NOT EXISTS idx_alergias_familia_farmaco ON public.alergias_cruzadas USING btree (familia_farmaco);
CREATE INDEX IF NOT EXISTS idx_alergias_severidad ON public.alergias_cruzadas USING btree (severidad);

CREATE INDEX IF NOT EXISTS idx_interacciones_farmaco_a ON public.interacciones_farmacologicas USING btree (farmaco_a);
CREATE INDEX IF NOT EXISTS idx_interacciones_farmaco_b ON public.interacciones_farmacologicas USING btree (farmaco_b);

CREATE INDEX IF NOT EXISTS idx_profilaxis_situacion ON public.profilaxis_endocarditis USING btree (situacion);

-- ============================================================
-- TRIGGERS updated_at (solo las 4 tablas que los tienen en producción)
-- Requiere update_updated_at_column() definida en schema.sql
-- ============================================================
CREATE TRIGGER set_vademecum_urgencia_updated_at
  BEFORE UPDATE ON public.vademecum_urgencia
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_antirresortivos_updated_at
  BEFORE UPDATE ON public.vademecum_antirresortivos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_alergias_cruzadas_updated_at
  BEFORE UPDATE ON public.alergias_cruzadas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_interacciones_updated_at
  BEFORE UPDATE ON public.interacciones_farmacologicas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.vademecum ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vademecum_urgencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vademecum_antirresortivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alergias_cruzadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacciones_farmacologicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profilaxis_endocarditis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manejo_anticoagulantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_data_meta ENABLE ROW LEVEL SECURITY;

-- vademecum: solo lectura pública (sin políticas de escritura — ver nota F6-B)
CREATE POLICY "Lectura pública de vademecum"
  ON public.vademecum FOR SELECT USING (true);

-- vademecum_urgencia
CREATE POLICY "Lectura pública de vademecum_urgencia"
  ON public.vademecum_urgencia FOR SELECT USING (true);
CREATE POLICY "urgencia_select_authenticated"
  ON public.vademecum_urgencia FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "urgencia_insert_authenticated"
  ON public.vademecum_urgencia FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY "urgencia_update_authenticated"
  ON public.vademecum_urgencia FOR UPDATE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "urgencia_delete_authenticated"
  ON public.vademecum_urgencia FOR DELETE USING ((auth.role() = 'authenticated'::text));

-- vademecum_antirresortivos
CREATE POLICY "Lectura pública de vademecum_antirresortivos"
  ON public.vademecum_antirresortivos FOR SELECT USING (true);
CREATE POLICY "antirresortivos_select_authenticated"
  ON public.vademecum_antirresortivos FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "antirresortivos_insert_authenticated"
  ON public.vademecum_antirresortivos FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY "antirresortivos_update_authenticated"
  ON public.vademecum_antirresortivos FOR UPDATE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "antirresortivos_delete_authenticated"
  ON public.vademecum_antirresortivos FOR DELETE USING ((auth.role() = 'authenticated'::text));

-- alergias_cruzadas
CREATE POLICY "Lectura pública de alergias_cruzadas"
  ON public.alergias_cruzadas FOR SELECT USING (true);
CREATE POLICY "alergias_select_authenticated"
  ON public.alergias_cruzadas FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "alergias_insert_authenticated"
  ON public.alergias_cruzadas FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY "alergias_update_authenticated"
  ON public.alergias_cruzadas FOR UPDATE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "alergias_delete_authenticated"
  ON public.alergias_cruzadas FOR DELETE USING ((auth.role() = 'authenticated'::text));

-- interacciones_farmacologicas
CREATE POLICY "Lectura pública de interacciones_farmacologicas"
  ON public.interacciones_farmacologicas FOR SELECT USING (true);
CREATE POLICY "interacciones_select_authenticated"
  ON public.interacciones_farmacologicas FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "interacciones_insert_authenticated"
  ON public.interacciones_farmacologicas FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY "interacciones_update_authenticated"
  ON public.interacciones_farmacologicas FOR UPDATE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "interacciones_delete_authenticated"
  ON public.interacciones_farmacologicas FOR DELETE USING ((auth.role() = 'authenticated'::text));

-- profilaxis_endocarditis
CREATE POLICY "Lectura pública de profilaxis_endocarditis"
  ON public.profilaxis_endocarditis FOR SELECT USING (true);
CREATE POLICY "profilaxis_select_authenticated"
  ON public.profilaxis_endocarditis FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "profilaxis_insert_authenticated"
  ON public.profilaxis_endocarditis FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY "profilaxis_update_authenticated"
  ON public.profilaxis_endocarditis FOR UPDATE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "profilaxis_delete_authenticated"
  ON public.profilaxis_endocarditis FOR DELETE USING ((auth.role() = 'authenticated'::text));

-- manejo_anticoagulantes
CREATE POLICY "Lectura pública de manejo_anticoagulantes"
  ON public.manejo_anticoagulantes FOR SELECT USING (true);
CREATE POLICY "anticoagulantes_select_authenticated"
  ON public.manejo_anticoagulantes FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "anticoagulantes_insert_authenticated"
  ON public.manejo_anticoagulantes FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY "anticoagulantes_update_authenticated"
  ON public.manejo_anticoagulantes FOR UPDATE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "anticoagulantes_delete_authenticated"
  ON public.manejo_anticoagulantes FOR DELETE USING ((auth.role() = 'authenticated'::text));

-- reference_data_meta: SIN lectura pública (solo authenticated)
CREATE POLICY "metadata_select_authenticated"
  ON public.reference_data_meta FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "metadata_insert_authenticated"
  ON public.reference_data_meta FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY "metadata_update_authenticated"
  ON public.reference_data_meta FOR UPDATE USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "metadata_delete_authenticated"
  ON public.reference_data_meta FOR DELETE USING ((auth.role() = 'authenticated'::text));

-- ============================================================
-- VERIFICACIÓN (ejecutar después del seed)
-- Debe devolver 27 tablas en total (19 previas + 8 del vademécum)
-- ============================================================
-- SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT 'vademecum' t, count(*) FROM public.vademecum UNION ALL
-- SELECT 'urgencia', count(*) FROM public.vademecum_urgencia UNION ALL
-- SELECT 'antirresortivos', count(*) FROM public.vademecum_antirresortivos UNION ALL
-- SELECT 'alergias', count(*) FROM public.alergias_cruzadas UNION ALL
-- SELECT 'interacciones', count(*) FROM public.interacciones_farmacologicas UNION ALL
-- SELECT 'profilaxis', count(*) FROM public.profilaxis_endocarditis UNION ALL
-- SELECT 'anticoagulantes', count(*) FROM public.manejo_anticoagulantes UNION ALL
-- SELECT 'metadata', count(*) FROM public.reference_data_meta;