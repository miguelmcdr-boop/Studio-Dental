-- F5-04: Tabla de auditoría de cambios para resolución de conflictos
--
-- Registra todas las operaciones de escritura críticas y las decisiones
-- de resolución de conflictos para trazabilidad.
--
-- Ejecutar manualmente en Supabase SQL Editor una sola vez.

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- RLS policies
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own audit logs" ON public.audit_log;
CREATE POLICY "Users can view own audit logs"
  ON public.audit_log
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_log;
CREATE POLICY "Users can insert own audit logs"
  ON public.audit_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record 
  ON public.audit_log(table_name, record_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at 
  ON public.audit_log(created_at);

-- Comentario
COMMENT ON TABLE public.audit_log IS 'Registro de operaciones críticas y resolución de conflictos (F5-04)';
COMMENT ON COLUMN public.audit_log.action IS 'INSERT, UPDATE, DELETE, CONFLICT_RESOLVED';
COMMENT ON COLUMN public.audit_log.resolution_strategy IS 'last_write_wins, manual_local, manual_remote, auto';
