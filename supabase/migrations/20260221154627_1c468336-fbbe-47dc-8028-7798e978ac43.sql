-- Add template_used column to track which template was used for each decision
ALTER TABLE public.decisions ADD COLUMN template_used text DEFAULT NULL;