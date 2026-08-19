-- ============================================================
-- F6-C-d.1: Trigger para auto-setear clinica_id en INSERT
-- ============================================================
-- Resuelve el NOT NULL de clinica_id sin modificar los 18 *StorageService
-- del frontend. El trigger setea clinica_id = clinica_actual() si viene NULL.
-- Si clinica_actual() retorna NULL (usuario sin membresía), hace RAISE EXCEPTION.
-- Idempotente: seguro re-ejecutar.
-- ============================================================

-- Función del trigger
CREATE OR REPLACE FUNCTION public.set_clinica_id_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinica UUID;
BEGIN
  -- Si clinica_id ya viene seteado, no hacer nada
  IF NEW.clinica_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Obtener clínica actual del usuario
  v_clinica := public.clinica_actual();
  
  IF v_clinica IS NULL THEN
    RAISE EXCEPTION 'Usuario % no tiene membresía activa en ninguna clínica', auth.uid();
  END IF;

  NEW.clinica_id := v_clinica;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_clinica_id_on_insert() IS
  'BEFORE INSERT: setea clinica_id = clinica_actual() si viene NULL. RAISE EXCEPTION si no hay membresía activa.';

-- Aplicar trigger a las 18 tablas
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
    -- Eliminar trigger si existe (idempotente)
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'trigger_set_clinica_id_' || t, t);
    
    -- Crear trigger BEFORE INSERT
    EXECUTE format(
      'CREATE TRIGGER %I
         BEFORE INSERT ON public.%I
         FOR EACH ROW
         EXECUTE FUNCTION public.set_clinica_id_on_insert()',
      'trigger_set_clinica_id_' || t, t);
    
    RAISE NOTICE 'Trigger creado en tabla %', t;
  END LOOP;
END;
$$;

-- GRANTs
REVOKE ALL ON FUNCTION public.set_clinica_id_on_insert() FROM anon;
GRANT EXECUTE ON FUNCTION public.set_clinica_id_on_insert() TO authenticated, service_role;
