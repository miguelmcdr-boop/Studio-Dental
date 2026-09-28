-- F7-36 FASE 7: Versionar auditar_cambio() y sus triggers
--
-- PROBLEMA: La función auditar_cambio() existía en producción (F6-F)
-- pero NO estaba versionada en el repositorio. Esto causaba error
-- en rebuild: "auditar_cambio() no existe".
--
-- SOLUCIÓN: Crear migración que versiona la función completa y los
-- 11 triggers que la usan. Extraído del backup de producción.
--
-- ORDEN DE EJECUCIÓN:
-- Esta migración debe ejecutarse DESPUÉS de las tablas (0001-0009)
-- y ANTES de 2026_08_29 (que verifica existencia de auditar_cambio).
-- El orden alfabético (20260101000020) garantiza esto.
--
-- TABLAS CON TRIGGERS (11):
-- certificados, citas, evoluciones_clinicas, movimientos_financieros,
-- odontogramas, pacientes, pagos, periodontogramas,
-- presupuesto_items, presupuestos, recetas
-- ============================================================

-- ============================================================
-- 1. Función auditar_cambio() (SECURITY DEFINER, owner postgres)
-- ============================================================
CREATE OR REPLACE FUNCTION public.auditar_cambio()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_clinica_id UUID;
  v_action TEXT;
  v_old_data JSONB;
  v_new_data JSONB;
  v_record_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    v_action := 'INSERT';
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW);
    v_clinica_id := NEW.clinica_id;
    v_record_id := NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
    v_clinica_id := NEW.clinica_id;
    v_record_id := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
    v_old_data := to_jsonb(OLD);
    v_new_data := NULL;
    v_clinica_id := OLD.clinica_id;
    v_record_id := OLD.id;
  END IF;
  
  INSERT INTO audit_log (
    user_id, user_email, clinica_id, table_name, record_id,
    action, old_data, new_data, created_at
  ) VALUES (
    v_user_id, v_user_email, v_clinica_id, TG_TABLE_NAME, v_record_id,
    v_action, v_old_data, v_new_data, NOW()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Owner postgres para BYPASSRLS (puede insertar en audit_log sin política INSERT)
ALTER FUNCTION public.auditar_cambio() OWNER TO postgres;

COMMENT ON FUNCTION public.auditar_cambio() IS
  'Trigger function SECURITY DEFINER (owner postgres) que registra cambios '
  'en audit_log. BYPASSRLS permite insertar sin política INSERT explícita. '
  'Versionado en F7-36 FASE 7 (antes era dependencia histórica de F6-F).';

-- ============================================================
-- 2. Triggers en las 11 tablas (AFTER INSERT OR DELETE OR UPDATE)
-- ============================================================
-- Cada trigger se ejecuta DESPUÉS de la operación y registra el cambio
-- en audit_log vía auditar_cambio().

CREATE OR REPLACE TRIGGER trg_certificados_audit
  AFTER INSERT OR DELETE OR UPDATE ON public.certificados
  FOR EACH ROW EXECUTE FUNCTION public.auditar_cambio();

CREATE OR REPLACE TRIGGER trg_citas_audit
  AFTER INSERT OR DELETE OR UPDATE ON public.citas
  FOR EACH ROW EXECUTE FUNCTION public.auditar_cambio();

CREATE OR REPLACE TRIGGER trg_evoluciones_audit
  AFTER INSERT OR DELETE OR UPDATE ON public.evoluciones_clinicas
  FOR EACH ROW EXECUTE FUNCTION public.auditar_cambio();

CREATE OR REPLACE TRIGGER trg_movimientos_financieros_audit
  AFTER INSERT OR DELETE OR UPDATE ON public.movimientos_financieros
  FOR EACH ROW EXECUTE FUNCTION public.auditar_cambio();

CREATE OR REPLACE TRIGGER trg_odontogramas_audit
  AFTER INSERT OR DELETE OR UPDATE ON public.odontogramas
  FOR EACH ROW EXECUTE FUNCTION public.auditar_cambio();

CREATE OR REPLACE TRIGGER trg_pacientes_audit
  AFTER INSERT OR DELETE OR UPDATE ON public.pacientes
  FOR EACH ROW EXECUTE FUNCTION public.auditar_cambio();

CREATE OR REPLACE TRIGGER trg_pagos_audit
  AFTER INSERT OR DELETE OR UPDATE ON public.pagos
  FOR EACH ROW EXECUTE FUNCTION public.auditar_cambio();

CREATE OR REPLACE TRIGGER trg_periodontogramas_audit
  AFTER INSERT OR DELETE OR UPDATE ON public.periodontogramas
  FOR EACH ROW EXECUTE FUNCTION public.auditar_cambio();

CREATE OR REPLACE TRIGGER trg_presupuesto_items_audit
  AFTER INSERT OR DELETE OR UPDATE ON public.presupuesto_items
  FOR EACH ROW EXECUTE FUNCTION public.auditar_cambio();

CREATE OR REPLACE TRIGGER trg_presupuestos_audit
  AFTER INSERT OR DELETE OR UPDATE ON public.presupuestos
  FOR EACH ROW EXECUTE FUNCTION public.auditar_cambio();

CREATE OR REPLACE TRIGGER trg_recetas_audit
  AFTER INSERT OR DELETE OR UPDATE ON public.recetas
  FOR EACH ROW EXECUTE FUNCTION public.auditar_cambio();

-- ============================================================
-- VERIFICACIÓN
-- ============================================================
-- Debe devolver 11 triggers:
-- SELECT trigger_name, event_object_table
-- FROM information_schema.triggers
-- WHERE action_statement LIKE '%auditar_cambio%'
-- ORDER BY event_object_table;
