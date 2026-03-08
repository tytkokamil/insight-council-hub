
-- Prompt 18: Escalation Rules table
CREATE TABLE IF NOT EXISTS public.escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  condition_type TEXT NOT NULL DEFAULT 'sla_exceeded',
  condition_value INTEGER NOT NULL DEFAULT 24,
  escalate_to TEXT NOT NULL DEFAULT 'owner',
  notify_channels TEXT[] DEFAULT ARRAY['app','email'],
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NOT NULL
);

ALTER TABLE public.escalation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org escalation rules" ON public.escalation_rules
FOR SELECT TO authenticated
USING (org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage escalation rules" ON public.escalation_rules
FOR ALL TO authenticated
USING (public.is_org_admin_or_owner(auth.uid()))
WITH CHECK (public.is_org_admin_or_owner(auth.uid()));

-- Prompt 18: Escalation log table
CREATE TABLE IF NOT EXISTS public.escalation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID REFERENCES public.decisions(id) ON DELETE CASCADE NOT NULL,
  rule_id UUID REFERENCES public.escalation_rules(id) ON DELETE CASCADE,
  escalated_to UUID,
  status TEXT DEFAULT 'sent',
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE
);

ALTER TABLE public.escalation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org escalation logs" ON public.escalation_log
FOR SELECT TO authenticated
USING (org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "System can insert escalation logs" ON public.escalation_log
FOR INSERT TO authenticated
WITH CHECK (org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid()));

-- Prompt 19: Org Badges table
CREATE TABLE IF NOT EXISTS public.org_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'bronze',
  quality_score NUMERIC,
  velocity_score NUMERIC,
  decisions_count INTEGER,
  issued_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '6 months',
  badge_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_public BOOLEAN DEFAULT false
);

ALTER TABLE public.org_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public badges" ON public.org_badges
FOR SELECT USING (is_public = true);

CREATE POLICY "Org members can view their badge" ON public.org_badges
FOR SELECT TO authenticated
USING (org_id IN (SELECT org_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage badges" ON public.org_badges
FOR ALL TO authenticated
USING (public.is_org_admin_or_owner(auth.uid()))
WITH CHECK (public.is_org_admin_or_owner(auth.uid()));
