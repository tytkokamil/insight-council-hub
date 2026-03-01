
-- Compliance configuration per org
CREATE TABLE public.compliance_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  framework TEXT NOT NULL, -- 'nis2', 'gmp', 'marisk', 'iso9001', 'iatf16949'
  enabled BOOLEAN NOT NULL DEFAULT false,
  next_audit_date DATE,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, framework)
);

ALTER TABLE public.compliance_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view compliance config"
  ON public.compliance_config FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.org_id = compliance_config.org_id AND p.user_id = auth.uid()));

CREATE POLICY "Org admins can manage compliance config"
  ON public.compliance_config FOR ALL
  USING (is_org_admin_or_owner(auth.uid()) AND EXISTS (SELECT 1 FROM profiles p WHERE p.org_id = compliance_config.org_id AND p.user_id = auth.uid()));

-- Compliance calendar events (auto-generated from config)
CREATE TABLE public.compliance_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  framework TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'audit', -- 'audit', 'review', 'reminder', 'preparation'
  recurrence TEXT, -- 'yearly', 'quarterly', 'monthly', null
  auto_create_decision BOOLEAN NOT NULL DEFAULT false,
  decision_id UUID REFERENCES public.decisions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view compliance events"
  ON public.compliance_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.org_id = compliance_events.org_id AND p.user_id = auth.uid()));

CREATE POLICY "Org admins can manage compliance events"
  ON public.compliance_events FOR ALL
  USING (is_org_admin_or_owner(auth.uid()) AND EXISTS (SELECT 1 FROM profiles p WHERE p.org_id = compliance_events.org_id AND p.user_id = auth.uid()));
