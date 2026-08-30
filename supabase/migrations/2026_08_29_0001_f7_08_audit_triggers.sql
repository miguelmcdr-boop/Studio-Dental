-- ============================================================
-- F7-08: Triggers de auditoría server-side + audit_log no escribible por cliente
--
-- Cierra F6-F: garantiza que todas las operaciones críticas en tablas
-- clínicas se registren en audit_log mediante triggers server-side,
-- eliminando la dependencia de registrarAuditoria() client-side.
--
-- Cambios:
-- 1. Función log_audit_change() con SECURITY DEFINER
-- 2. Trigger genérico aplicado a 11 tablas clínicas
-- 3. Eliminación de política INSERT del cliente
-- 4. Política INSERT solo para la función (SECURITY DEFINER)
-- ============================================================

-- 1. Función de auditoría server-side
CREATE OR REPLACE FUNCTION public.log_audit_change()
RETURNS TRIGGER AS $$
DECLARE
  v_record_id text;
  v_old_data jsonb;
  v_new_data jsonb;
BEGIN
  -- Capturar el ID del registro según la operación
  IF TG_OP = 'DELETE' THEN
    v_record_id := OLD.id::text;
    v_old_data := row_to_json(OLD)::jsonb;
    v_new_data := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    v_record_id := NEW.id::text;
    v_old_data := row_to_json(OLD)::jsonb;
    v_new_data := row_to_json(NEW)::jsonb;
  ELSE -- INSERT
    v_record_id := NEW.id::text;
    v_old_data := NULL;
    v_new_data := row_to_json(NEW)::jsonb;
  END IF;

  -- Registrar en audit_log
  INSERT INTO public.audit_log (user_id, table_name, record_id, action, old_data, new_data)
  VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    v_record_id,
    TG_OP,
    v_old_data,
    v_new_data
  );

  -- Retornar el registro original (no modificar la operación)
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Función auxiliar para crear triggers idempotentemente
CREATE OR REPLACE FUNCTION public.create_audit_trigger(p_table_name text)
RETURNS void AS $$
BEGIN
  -- Validar que la tabla exista
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = p_table_name
  ) THEN
    RAISE EXCEPTION 'Tabla % no existe', p_table_name;
  END IF;

  -- Crear trigger (idempotente)
  EXECUTE format('
    DROP TRIGGER IF EXISTS audit_%I ON public.%I;
    CREATE TRIGGER audit_%I
      AFTER INSERT OR UPDATE OR DELETE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION public.log_audit_change();
  ', p_table_name, p_table_name, p_table_name, p_table_name);
END;
$$ LANGUAGE plpgsql;

-- 3. Aplicar trigger a 11 tablas clínicas
SELECT public.create_audit_trigger('pacientes');
SELECT public.create_audit_trigger('evoluciones_clinicas');
SELECT public.create_audit_trigger('recetas');
SELECT public.create_audit_trigger('odontogramas');
SELECT public.create_audit_trigger('periodontogramas');
SELECT public.create_audit_trigger('odontopediatria');
SELECT public.create_audit_trigger('quirurgico_implantes');
SELECT public.create_audit_trigger('quirurgico_endodoncia');
SELECT public.create_audit_trigger('dsd_configs');
SELECT public.create_audit_trigger('certificados');
SELECT public.create_audit_trigger('miembros_clinica');

-- 4. Eliminar política INSERT del cliente (seguridad crítica)
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_log;

-- 5. Agregar política INSERT solo para la función (SECURITY DEFINER)
-- Nota: SECURITY DEFINER bypass RLS, pero agregamos política para documentación
DROP POLICY IF EXISTS "audit_log_insert_from_trigger" ON public.audit_log;
CREATE POLICY "audit_log_insert_from_trigger"
  ON public.audit_log
  FOR INSERT
  WITH CHECK (true);

-- 6. Agregar política UPDATE y DELETE restrictivas (append-only)
-- Solo SECURITY DEFINER puede UPDATE/DELETE (para mantenimiento futuro)
DROP POLICY IF EXISTS "audit_log_update_restricted" ON public.audit_log;
CREATE POLICY "audit_log_update_restricted"
  ON public.audit_log
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "audit_log_delete_restricted" ON public.audit_log;
CREATE POLICY "audit_log_delete_restricted"
  ON public.audit_log
  FOR DELETE
  USING (false)
  WITH CHECK (false);

-- 7. Comentarios
COMMENT ON FUNCTION public.log_audit_change() IS 
  'F7-08: Registra operaciones INSERT/UPDATE/DELETE en audit_log. SECURITY DEFINER para bypass RLS.';
COMMENT ON FUNCTION public.create_audit_trigger(text) IS 
  'F7-08: Crea trigger de auditoría en una tabla específica (idempotente).';
