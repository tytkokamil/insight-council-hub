
-- SLA configuration table: defines escalation/reassign thresholds per category + priority
CREATE TABLE public.sla_configs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  priority text NOT NULL,
  escalation_hours_warn integer NOT NULL DEFAULT 48,
  escalation_hours_urgent integer NOT NULL DEFAULT 24,
  escalation_hours_overdue integer NOT NULL DEFAULT 0,
  reassign_days integer NOT NULL DEFAULT 7,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(category, priority)
);

-- Enable RLS
ALTER TABLE public.sla_configs ENABLE ROW LEVEL SECURITY;

-- Everyone can read SLA configs
CREATE POLICY "Authenticated users can view SLA configs"
ON public.sla_configs FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can manage SLA configs
CREATE POLICY "Admins can manage SLA configs"
ON public.sla_configs FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- Timestamp trigger
CREATE TRIGGER update_sla_configs_updated_at
BEFORE UPDATE ON public.sla_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default SLA configs for all category/priority combinations
INSERT INTO public.sla_configs (category, priority, escalation_hours_warn, escalation_hours_urgent, escalation_hours_overdue, reassign_days) VALUES
  ('strategic', 'critical', 48, 24, 0, 3),
  ('strategic', 'high', 72, 48, 0, 5),
  ('strategic', 'medium', 120, 72, 0, 7),
  ('strategic', 'low', 168, 120, 0, 14),
  ('budget', 'critical', 24, 12, 0, 3),
  ('budget', 'high', 48, 24, 0, 5),
  ('budget', 'medium', 96, 48, 0, 7),
  ('budget', 'low', 168, 96, 0, 14),
  ('hr', 'critical', 48, 24, 0, 3),
  ('hr', 'high', 72, 48, 0, 5),
  ('hr', 'medium', 120, 72, 0, 10),
  ('hr', 'low', 168, 120, 0, 14),
  ('technical', 'critical', 24, 12, 0, 2),
  ('technical', 'high', 48, 24, 0, 5),
  ('technical', 'medium', 96, 48, 0, 7),
  ('technical', 'low', 168, 96, 0, 14),
  ('operational', 'critical', 24, 12, 0, 3),
  ('operational', 'high', 48, 24, 0, 5),
  ('operational', 'medium', 96, 48, 0, 7),
  ('operational', 'low', 168, 96, 0, 14),
  ('marketing', 'critical', 48, 24, 0, 3),
  ('marketing', 'high', 72, 48, 0, 5),
  ('marketing', 'medium', 120, 72, 0, 7),
  ('marketing', 'low', 168, 120, 0, 14);
