
-- Microsoft Teams integration config per org
CREATE TABLE public.teams_integration_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  webhook_url text NOT NULL,
  channel_name text,
  enabled boolean NOT NULL DEFAULT true,
  notify_new_decision boolean NOT NULL DEFAULT true,
  notify_sla_violation boolean NOT NULL DEFAULT true,
  notify_escalation boolean NOT NULL DEFAULT true,
  notify_review_request boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id)
);

ALTER TABLE public.teams_integration_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view Teams config"
  ON public.teams_integration_config FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.org_id = teams_integration_config.org_id AND p.user_id = auth.uid()));

CREATE POLICY "Org admins can manage Teams config"
  ON public.teams_integration_config FOR ALL
  USING (is_org_admin_or_owner(auth.uid()) AND EXISTS (SELECT 1 FROM profiles p WHERE p.org_id = teams_integration_config.org_id AND p.user_id = auth.uid()));

-- Log of sent Teams notifications
CREATE TABLE public.teams_notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  decision_id uuid REFERENCES public.decisions(id),
  notification_type text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.teams_notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view Teams logs"
  ON public.teams_notification_log FOR SELECT
  USING (is_org_admin_or_owner(auth.uid()) AND EXISTS (SELECT 1 FROM profiles p WHERE p.org_id = teams_notification_log.org_id AND p.user_id = auth.uid()));
