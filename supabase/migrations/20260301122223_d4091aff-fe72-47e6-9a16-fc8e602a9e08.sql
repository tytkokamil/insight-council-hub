
-- Inbound email configuration per org
CREATE TABLE public.inbound_email_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email_prefix text NOT NULL DEFAULT 'entscheidungen',
  allowed_domains text[] NOT NULL DEFAULT '{}',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id)
);

ALTER TABLE public.inbound_email_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view inbound email config"
  ON public.inbound_email_config FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.org_id = inbound_email_config.org_id AND p.user_id = auth.uid()));

CREATE POLICY "Org admins can manage inbound email config"
  ON public.inbound_email_config FOR ALL
  USING (is_org_admin_or_owner(auth.uid()) AND EXISTS (SELECT 1 FROM profiles p WHERE p.org_id = inbound_email_config.org_id AND p.user_id = auth.uid()));

-- Inbound email processing log
CREATE TABLE public.inbound_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  decision_id uuid REFERENCES public.decisions(id),
  from_email text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'processed',
  error_message text,
  ai_extraction jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inbound_email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view inbound email logs"
  ON public.inbound_email_log FOR SELECT
  USING (is_org_admin_or_owner(auth.uid()) AND EXISTS (SELECT 1 FROM profiles p WHERE p.org_id = inbound_email_log.org_id AND p.user_id = auth.uid()));

CREATE POLICY "Service can insert logs"
  ON public.inbound_email_log FOR INSERT
  WITH CHECK (true);

-- Add decision_attachments table for file attachments
CREATE TABLE public.decision_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id uuid NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.decision_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view attachments"
  ON public.decision_attachments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert attachments"
  ON public.decision_attachments FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Uploaders and admins can delete attachments"
  ON public.decision_attachments FOR DELETE
  USING (auth.uid() = uploaded_by OR is_org_admin_or_owner(auth.uid()));

-- Storage bucket for decision attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('decision-attachments', 'decision-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can read decision attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'decision-attachments');

CREATE POLICY "Service role can upload decision attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'decision-attachments');
