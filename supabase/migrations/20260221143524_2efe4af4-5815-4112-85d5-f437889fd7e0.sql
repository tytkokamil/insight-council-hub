
-- Add archived_at to decisions
ALTER TABLE public.decisions ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Data retention config table
CREATE TABLE public.data_retention_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auto_archive_days INTEGER NOT NULL DEFAULT 90,
  auto_delete_archived_days INTEGER DEFAULT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL
);

ALTER TABLE public.data_retention_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view retention config"
  ON public.data_retention_config FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Org admins can manage retention config"
  ON public.data_retention_config FOR ALL
  USING (is_org_admin_or_owner(auth.uid()));
