
-- ═══════════════════════════════════════════════════════════
-- KPI REGISTRY: Central definition of all system KPIs
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.kpi_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'operational',
  unit text NOT NULL DEFAULT '%',
  positive_direction text NOT NULL DEFAULT 'up' CHECK (positive_direction IN ('up', 'down')),
  calculation_key text NOT NULL,
  adaptive boolean NOT NULL DEFAULT false,
  default_threshold_critical numeric,
  default_threshold_warning numeric,
  default_threshold_good numeric,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kpi_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view KPI definitions"
  ON public.kpi_definitions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Org admins can manage KPI definitions"
  ON public.kpi_definitions FOR ALL
  USING (public.is_org_admin_or_owner(auth.uid()));

-- ═══════════════════════════════════════════════════════════
-- ORG KPI CONFIG: Per-org threshold overrides & weights
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.org_kpi_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id uuid NOT NULL REFERENCES public.kpi_definitions(id) ON DELETE CASCADE,
  custom_threshold_critical numeric,
  custom_threshold_warning numeric,
  custom_threshold_good numeric,
  custom_weight numeric NOT NULL DEFAULT 1.0,
  benchmark_mode text NOT NULL DEFAULT 'fixed' CHECK (benchmark_mode IN ('fixed', 'relative')),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kpi_id)
);

ALTER TABLE public.org_kpi_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view org KPI config"
  ON public.org_kpi_config FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Org admins can manage org KPI config"
  ON public.org_kpi_config FOR ALL
  USING (public.is_org_admin_or_owner(auth.uid()));

-- ═══════════════════════════════════════════════════════════
-- ECONOMIC CONFIG: Priority multipliers & CoD settings
-- ═══════════════════════════════════════════════════════════
CREATE TABLE public.economic_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value numeric NOT NULL,
  label text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.economic_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view economic config"
  ON public.economic_config FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Org admins can manage economic config"
  ON public.economic_config FOR ALL
  USING (public.is_org_admin_or_owner(auth.uid()));

-- Seed priority multipliers
INSERT INTO public.economic_config (config_key, config_value, label, description, category) VALUES
  ('multiplier_low', 1, 'Low Priority Multiplier', 'Cost-of-Delay Multiplikator für niedrige Priorität', 'priority_multiplier'),
  ('multiplier_medium', 2, 'Medium Priority Multiplier', 'Cost-of-Delay Multiplikator für mittlere Priorität', 'priority_multiplier'),
  ('multiplier_high', 3, 'High Priority Multiplier', 'Cost-of-Delay Multiplikator für hohe Priorität', 'priority_multiplier'),
  ('multiplier_critical', 4, 'Critical Priority Multiplier', 'Cost-of-Delay Multiplikator für kritische Priorität', 'priority_multiplier'),
  ('default_hourly_rate', 75, 'Default Hourly Rate', 'Standard-Stundensatz wenn kein Team-Satz definiert', 'cost'),
  ('working_hours_per_day', 8, 'Working Hours per Day', 'Arbeitsstunden pro Tag für Kostenberechnung', 'cost');

-- Seed KPI definitions
INSERT INTO public.kpi_definitions (kpi_key, label, description, category, unit, positive_direction, calculation_key, adaptive, default_threshold_critical, default_threshold_warning, default_threshold_good, sort_order) VALUES
  ('decision_health', 'Decision Health', 'Anteil gesunder Entscheidungen (nicht überfällig, nicht eskaliert)', 'governance', '%', 'up', 'decision_health', true, 50, 70, 85, 1),
  ('risk_exposure', 'Risk Exposure', 'Anzahl Entscheidungen mit hohem Risiko-Score', 'risk', 'count', 'down', 'risk_exposure', false, 10, 5, 2, 2),
  ('cost_of_delay', 'Cost of Delay', 'Geschätzte Verzögerungskosten aller aktiven Entscheidungen', 'economic', '€', 'down', 'cost_of_delay', true, 100000, 50000, 10000, 3),
  ('sla_compliance', 'SLA Compliance', 'Anteil Entscheidungen innerhalb SLA-Grenzen', 'governance', '%', 'up', 'sla_compliance', true, 60, 75, 90, 4),
  ('completion_rate', 'Completion Rate', 'Anteil abgeschlossener Entscheidungen', 'performance', '%', 'up', 'completion_rate', true, 30, 50, 70, 5),
  ('avg_duration', 'Avg Duration', 'Durchschnittliche Entscheidungsdauer in Tagen', 'performance', 'days', 'down', 'avg_duration', true, 30, 14, 7, 6),
  ('escalation_rate', 'Escalation Rate', 'Anteil eskalierter Entscheidungen', 'governance', '%', 'down', 'escalation_rate', true, 30, 15, 5, 7),
  ('review_throughput', 'Review Throughput', 'Durchschnittliche Review-Zeit in Tagen', 'performance', 'days', 'down', 'review_throughput', true, 14, 7, 3, 8),
  ('rework_rate', 'Rework Rate', 'Anteil zurückgewiesener und neu bearbeiteter Entscheidungen', 'quality', '%', 'down', 'rework_rate', true, 25, 15, 5, 9),
  ('team_velocity', 'Team Velocity', 'Entscheidungen pro Woche pro Team', 'performance', '/week', 'up', 'team_velocity', true, 1, 3, 5, 10),
  ('automation_coverage', 'Automation Coverage', 'Anteil durch Regeln abgedeckter Entscheidungen', 'governance', '%', 'up', 'automation_coverage', false, 20, 40, 60, 11),
  ('blocked_ratio', 'Blocked Ratio', 'Anteil blockierter Tasks', 'operational', '%', 'down', 'blocked_ratio', false, 20, 10, 3, 12);

-- Triggers for updated_at
CREATE TRIGGER update_kpi_definitions_updated_at BEFORE UPDATE ON public.kpi_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_org_kpi_config_updated_at BEFORE UPDATE ON public.org_kpi_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_economic_config_updated_at BEFORE UPDATE ON public.economic_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
