
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_decisions_is_demo ON public.decisions(org_id, is_demo);
