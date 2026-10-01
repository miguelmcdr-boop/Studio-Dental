-- ============================================================
-- F7-08 (CORREGIDA 2026-08-31): audit_log no escribible por cliente + append-only
--
-- CONTEXTO:
-- La función auditar_cambio() y sus triggers YA existen en 12 tablas
-- (creados en F6-F). Esta migración NO los recrea.
--
-- GAP ORIGINAL que resuelve F7-08:
-- La política pre-existente "audit_log_insert_clinica" permitía al
-- cliente autenticado hacer INSERT directo en audit_log, posibilitando
-- la inyección de registros falsos.
--
-- SOLUCIÓN:
-- 1. Eliminar política INSERT del cliente
-- 2. Agregar políticas UPDATE/DELETE restrictivas (append-only)
-- 3. El trigger auditar_cambio() sigue insertando porque:
--    - Es SECURITY DEFINER
--    - Su owner es postgres con BYPASSRLS
--
-- Sincroniza además el schema con producción (corrige drift de F7-13).
-- ============================================================

-- 1. Sincronización de schema (idempotente).
--    F7-13 no incluía clinica_id ni user_email en audit_log,
--    pero producción sí las tiene (de F6-F).
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS clinica_id uuid;
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS user_email text;
CREATE INDEX IF NOT EXISTS idx_audit_log_clinica ON public.audit_log(clinica_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id, created_at DESC);

-- 2. Verificación defensiva: auditar_cambio() debe existir (de F6-F)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'auditar_cambio') THEN
    RAISE EXCEPTION 'F7-08: auditar_cambio() no existe. Ejecutar F6-F primero.';
  END IF;
END $$;

-- 3. Eliminar políticas INSERT del cliente (seguridad crítica)
DROP POLICY IF EXISTS "audit_log_insert_clinica" ON public.audit_log;
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_log;

-- 4. Append-only: denegar UPDATE y DELETE al cliente
DROP POLICY IF EXISTS "audit_log_no_update" ON public.audit_log;
CREATE POLICY "audit_log_no_update" ON public.audit_log
  FOR UPDATE USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "audit_log_no_delete" ON public.audit_log;
CREATE POLICY "audit_log_no_delete" ON public.audit_log
  FOR DELETE USING (false);

-- 5. Las políticas SELECT existentes se mantienen intactas:
--    audit_log_select_admin, audit_log_select_clinica, audit_log_select_own

COMMENT ON TABLE public.audit_log IS
  'F7-08: Registro de operaciones críticas. Append-only (no UPDATE/DELETE por cliente). '
  'Escritura solo vía trigger auditar_cambio() (SECURITY DEFINER, owner postgres con BYPASSRLS).';
