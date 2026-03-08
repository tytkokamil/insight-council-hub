
CREATE TABLE public.public_dashboard_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL,
  token TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex') UNIQUE,
  title TEXT NOT NULL DEFAULT 'Dashboard',
  filters JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.public_dashboard_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own dashboard links"
  ON public.public_dashboard_links
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Anyone can view active links by token"
  ON public.public_dashboard_links
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
