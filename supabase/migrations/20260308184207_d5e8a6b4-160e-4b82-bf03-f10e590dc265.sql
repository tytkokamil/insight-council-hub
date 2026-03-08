
ALTER TABLE public.teams_integration_config 
  ADD COLUMN IF NOT EXISTS daily_brief_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS daily_brief_time text DEFAULT '07:30';
