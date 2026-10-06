-- ============================================================
-- Replicación Realtime para tabla clinicas (Hotfix BP02.4)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'clinicas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clinicas;
  END IF;
END $$;
