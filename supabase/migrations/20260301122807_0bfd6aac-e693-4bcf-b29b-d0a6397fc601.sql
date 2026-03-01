
-- Webhook endpoint configurations per org
CREATE TABLE public.webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  url text NOT NULL,
  secret_token text NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  events text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view webhook endpoints"
  ON public.webhook_endpoints FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.org_id = webhook_endpoints.org_id AND p.user_id = auth.uid()));

CREATE POLICY "Org admins can manage webhook endpoints"
  ON public.webhook_endpoints FOR ALL
  USING (is_org_admin_or_owner(auth.uid()) AND EXISTS (SELECT 1 FROM profiles p WHERE p.org_id = webhook_endpoints.org_id AND p.user_id = auth.uid()));

-- Webhook delivery log
CREATE TABLE public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  event text NOT NULL,
  payload jsonb NOT NULL,
  response_status integer,
  response_body text,
  duration_ms integer,
  status text NOT NULL DEFAULT 'pending',
  attempt integer NOT NULL DEFAULT 1,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view webhook deliveries"
  ON public.webhook_deliveries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM webhook_endpoints we
    JOIN profiles p ON p.org_id = we.org_id
    WHERE we.id = webhook_deliveries.webhook_id AND p.user_id = auth.uid()
  ));

CREATE INDEX idx_webhook_deliveries_webhook_id ON public.webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_created_at ON public.webhook_deliveries(created_at DESC);
