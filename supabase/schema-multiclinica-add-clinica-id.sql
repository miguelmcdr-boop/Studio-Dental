-- ============================================================
-- F6-C-c.2: Agregar clinica_id a las 18 tablas + backfill + índices
-- ============================================================
-- Patrón RFC §4.4: ADD COLUMN nullable -> backfill -> SET NOT NULL -> INDEX
-- Backfill con la clínica inicial (00000000-...-000000000001, creada en F6-C-b)
-- NO toca las políticas RLS (eso es C-c.3)
-- Idempotente y atómico (el DO block se revierte si algo falla)
-- ============================================================

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'pacientes','citas','prestaciones','presupuestos','presupuesto_items','pagos',
    'movimientos_financieros','inventario','evoluciones_clinicas','recetas',
    'odontogramas','periodontogramas','periodontogramas_historial','dsd_configs',
    'odontopediatria','quirurgico_implantes','quirurgico_endodoncia','audit_log'
  ]
  LOOP
    -- 1. Agregar columna nullable (idempotente)
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS clinica_id UUID REFERENCES public.clinicas(id)',
      t);

    -- 2. Backfill con la clínica inicial (solo filas sin clinica_id)
    EXECUTE format(
      'UPDATE public.%I SET clinica_id = %L WHERE clinica_id IS NULL',
      t, '00000000-0000-0000-0000-000000000001'::uuid);

    -- 3. SET NOT NULL (seguro porque el backfill cubrió todas las filas)
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN clinica_id SET NOT NULL',
      t);

    -- 4. Índice en clinica_id
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I(clinica_id)',
      'idx_' || t || '_clinica', t);

    RAISE NOTICE 'Tabla % : clinica_id agregado + backfill + NOT NULL + índice', t;
  END LOOP;
END;
$$;
