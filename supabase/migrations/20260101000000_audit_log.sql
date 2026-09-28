-- F7-36 FASE 7: Migración inicial de audit_log
--
-- PROBLEMA: Las migraciones 0003-0007 referencian audit_log (para políticas RLS)
-- pero la tabla se crea recién en 0008. Esto causaba error en rebuild:
--   ERROR: relation "audit_log" does not exist (SQLSTATE 42P01)
--
-- SOLUCIÓN: Crear audit_log al inicio (migración 0000) para que esté disponible
-- para todas las migraciones posteriores. La migración 0008 actual se mantiene
-- pero será idempotente (CREATE TABLE IF NOT EXISTS).
--
-- Esta migración crea:
-- 1. Tabla audit_log con estructura completa
-- 2. RLS habilitado
-- 3. Políticas SELECT (3 políticas)
-- 4. Políticas UPDATE/DELETE restrictivas (append-only)
-- 5. Índices (4 índices)
-- 6. Comentarios
--
-- NO crea política INSERT: el trigger auditar_cambio() (SECURITY DEFINER,
-- owner postgres con BYPASSRLS) puede insertar sin política explícita.
-- ============================================================

-- Crear tabla audit_log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clinica_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name text NOT NULL,
  record_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'CONFLICT_RESOLVED')),
  old_data jsonb,
  new_data jsonb,
  resolution_strategy text CHECK (resolution_strategy IN ('last_write_wins', 'manual_local', 'manual_remote', 'auto')),
  user_email text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas SELECT (lectura)
DROP POLICY IF EXISTS "audit_log_select_own" ON public.audit_log;
CREATE POLICY "audit_log_select_own"
  ON public.audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "audit_log_select_clinica" ON public.audit_log;
CREATE POLICY "audit_log_select_clinica"
  ON public.audit_log
  FOR SELECT
  USING (
    clinica_id = public.clinica_actual()
    AND public.tiene_rol_en_clinica(ARRAY['admin', 'dentista', 'asistente', 'recepcion']::app_role[])
  );

DROP POLICY IF EXISTS "audit_log_select_admin" ON public.audit_log;
CREATE POLICY "audit_log_select_admin"
  ON public.audit_log
  FOR SELECT
  USING (
    clinica_id = public.clinica_actual()
    AND public.es_admin_de_clinica_actual()
  );

-- Políticas UPDATE/DELETE restrictivas (append-only)
DROP POLICY IF EXISTS "audit_log_no_update" ON public.audit_log;
CREATE POLICY "audit_log_no_update" ON public.audit_log
  FOR UPDATE USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "audit_log_no_delete" ON public.audit_log;
CREATE POLICY "audit_log_no_delete" ON public.audit_log
  FOR DELETE USING (false);

-- Índices
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record
  ON public.audit_log(table_name, record_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
  ON public.audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_clinica
  ON public.audit_log(clinica_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user
  ON public.audit_log(user_id, created_at DESC);

-- Comentarios
COMMENT ON TABLE public.audit_log IS
  'F7-08: Registro append-only de operaciones críticas. '
  'Escritura solo vía trigger auditar_cambio() (SECURITY DEFINER).';
COMMENT ON COLUMN public.audit_log.action IS 'INSERT, UPDATE, DELETE, CONFLICT_RESOLVED';
COMMENT ON COLUMN public.audit_log.resolution_strategy IS 'last_write_wins, manual_local, manual_remote, auto';
