-- Add template versioning columns to decisions
ALTER TABLE public.decisions 
ADD COLUMN IF NOT EXISTS template_version integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS template_snapshot jsonb DEFAULT NULL;