-- F7-04: Poblar y validar columnas numéricas de dosis del vademécum + fallback seguro
-- Dependencias: F7-02/F7-03
--
-- Objetivo:
-- 1. Agregar columnas faltantes para evitar cálculos derivados en JS.
-- 2. Poblar dosis y presentación numérica de anestésicos inyectables.
-- 3. Validar integridad mínima de datos clínicos.
--
-- Nota clínica:
-- Valores derivados de la posología textual ya presente en seed-vademecum.sql.
-- Deben mantenerse bajo revisión clínica antes de cambios futuros.

-- ═══════════════════════════════════════════════════════════════
-- 1. Columnas faltantes
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.vademecum
  ADD COLUMN IF NOT EXISTS dosis_max_adulto_mg_por_kg DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS dosis_max_pediatrica_mg INTEGER;

COMMENT ON COLUMN public.vademecum.dosis_max_adulto_mg_por_kg IS
  'Dosis máxima adulta por peso en mg/kg. F7-04: evita derivar desde tope absoluto / 70kg.';

COMMENT ON COLUMN public.vademecum.dosis_max_pediatrica_mg IS
  'Tope absoluto pediátrico en mg cuando aplique. F7-04: evita ausencia de tope pediátrico explícito.';

-- ═══════════════════════════════════════════════════════════════
-- 2. Poblar anestésicos inyectables
-- ═══════════════════════════════════════════════════════════════

-- 1. Lidocaína 2% + Epinefrina 1:100.000
UPDATE public.vademecum SET
  dosis_max_adulto_mg = 500,
  dosis_max_adulto_mg_por_kg = 7.0,
  dosis_max_pediatrica_mg_por_kg = 4.5,
  dosis_max_pediatrica_mg = 300,
  contenido_por_unidad_mg = 36,
  volumen_por_unidad_ml = 1.8,
  concentracion_mg_por_ml = 20
WHERE numero = 1;

-- 2. Lidocaína 2% + Epinefrina 1:200.000
UPDATE public.vademecum SET
  dosis_max_adulto_mg = 500,
  dosis_max_adulto_mg_por_kg = 7.0,
  dosis_max_pediatrica_mg_por_kg = 4.5,
  dosis_max_pediatrica_mg = 300,
  contenido_por_unidad_mg = 36,
  volumen_por_unidad_ml = 1.8,
  concentracion_mg_por_ml = 20
WHERE numero = 2;

-- 3. Mepivacaína 3% sin vasoconstrictor
UPDATE public.vademecum SET
  dosis_max_adulto_mg = 300,
  dosis_max_adulto_mg_por_kg = 4.4,
  dosis_max_pediatrica_mg_por_kg = 4.0,
  dosis_max_pediatrica_mg = 200,
  contenido_por_unidad_mg = 54,
  volumen_por_unidad_ml = 1.8,
  concentracion_mg_por_ml = 30
WHERE numero = 3;

-- 4. Mepivacaína 2% + Levonordefrina 1:20.000
UPDATE public.vademecum SET
  dosis_max_adulto_mg = 400,
  dosis_max_adulto_mg_por_kg = 4.4,
  dosis_max_pediatrica_mg_por_kg = 4.0,
  dosis_max_pediatrica_mg = 200,
  contenido_por_unidad_mg = 36,
  volumen_por_unidad_ml = 1.8,
  concentracion_mg_por_ml = 20
WHERE numero = 4;

-- 5. Articaína 4% + Epinefrina 1:100.000
UPDATE public.vademecum SET
  dosis_max_adulto_mg = 500,
  dosis_max_adulto_mg_por_kg = 7.0,
  dosis_max_pediatrica_mg_por_kg = 5.0,
  dosis_max_pediatrica_mg = 300,
  contenido_por_unidad_mg = 72,
  volumen_por_unidad_ml = 1.8,
  concentracion_mg_por_ml = 40
WHERE numero = 5;

-- 6. Articaína 4% + Epinefrina 1:200.000
UPDATE public.vademecum SET
  dosis_max_adulto_mg = 500,
  dosis_max_adulto_mg_por_kg = 7.0,
  dosis_max_pediatrica_mg_por_kg = 5.0,
  dosis_max_pediatrica_mg = 300,
  contenido_por_unidad_mg = 72,
  volumen_por_unidad_ml = 1.8,
  concentracion_mg_por_ml = 40
WHERE numero = 6;

-- 7. Bupivacaína 0.5% + Epinefrina 1:200.000
UPDATE public.vademecum SET
  dosis_max_adulto_mg = 90,
  dosis_max_adulto_mg_por_kg = 1.3,
  dosis_max_pediatrica_mg_por_kg = 1.0,
  dosis_max_pediatrica_mg = 50,
  contenido_por_unidad_mg = 9,
  volumen_por_unidad_ml = 1.8,
  concentracion_mg_por_ml = 5
WHERE numero = 7;

-- 8. Benzocaína 20% tópico:
-- No es anestésico inyectable por tubo; se mantiene sin dosis por kg para calculadora de tubos.

-- ═══════════════════════════════════════════════════════════════
-- 3. Validación de integridad
-- ═══════════════════════════════════════════════════════════════

DO $$
DECLARE
  faltantes INTEGER;
BEGIN
  SELECT COUNT(*) INTO faltantes
  FROM public.vademecum
  WHERE numero IN (1, 2, 3, 4, 5, 6, 7)
    AND (
      dosis_max_adulto_mg IS NULL OR
      dosis_max_adulto_mg_por_kg IS NULL OR
      dosis_max_pediatrica_mg_por_kg IS NULL OR
      dosis_max_pediatrica_mg IS NULL OR
      contenido_por_unidad_mg IS NULL OR
      volumen_por_unidad_ml IS NULL OR
      concentracion_mg_por_ml IS NULL
    );

  IF faltantes > 0 THEN
    RAISE EXCEPTION 'F7-04: % anestésicos inyectables tienen campos numéricos faltantes', faltantes;
  END IF;

  SELECT COUNT(*) INTO faltantes
  FROM public.vademecum
  WHERE numero IN (1, 2, 3, 4, 5, 6, 7)
    AND (
      dosis_max_adulto_mg <= 0 OR
      dosis_max_adulto_mg_por_kg <= 0 OR
      dosis_max_pediatrica_mg_por_kg <= 0 OR
      dosis_max_pediatrica_mg <= 0 OR
      contenido_por_unidad_mg <= 0 OR
      volumen_por_unidad_ml <= 0 OR
      concentracion_mg_por_ml <= 0
    );

  IF faltantes > 0 THEN
    RAISE EXCEPTION 'F7-04: % anestésicos inyectables tienen valores numéricos no positivos', faltantes;
  END IF;

  RAISE NOTICE 'F7-04: Integridad de dosis de anestesia validada correctamente';
END $$;
