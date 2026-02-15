
-- Feature flags table for pilot mode
CREATE TABLE public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  category TEXT NOT NULL DEFAULT 'module',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Everyone can read feature flags
CREATE POLICY "Feature flags are readable by authenticated users"
  ON public.feature_flags FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can update feature flags
CREATE POLICY "Admins can update feature flags"
  ON public.feature_flags FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Insert default feature flags for all modules
INSERT INTO public.feature_flags (feature_key, label, description, enabled, category) VALUES
  ('executive', 'Executive Dashboard', 'C-Level Überblick mit KPIs', true, 'core'),
  ('dashboard', 'Dashboard', 'Hauptübersicht aller Entscheidungen', true, 'core'),
  ('decisions', 'Entscheidungen', 'Entscheidungen erstellen und verwalten', true, 'core'),
  ('briefing', 'CEO Briefing', 'Automatisch generierte Zusammenfassungen', true, 'core'),
  ('graph', 'Decision Graph', 'Abhängigkeiten zwischen Entscheidungen visualisieren', true, 'analysis'),
  ('bottlenecks', 'Bottleneck Intelligence', 'Engpässe identifizieren', false, 'analysis'),
  ('costs', 'Opportunity Cost Radar', 'Kosten verpasster Chancen berechnen', false, 'analysis'),
  ('friction', 'Friction Map', 'Reibungspunkte im Entscheidungsprozess', false, 'analysis'),
  ('health', 'Health Heatmap', 'Gesundheitsstatus aller Entscheidungen', false, 'analysis'),
  ('analytics', 'Analytics', 'Trend-Analysen und Statistiken', true, 'analysis'),
  ('dna', 'Decision DNA', 'Entscheidungskultur und Muster analysieren', false, 'intelligence'),
  ('engine', 'Escalation Engine', 'Automatische Eskalationsregeln', true, 'intelligence'),
  ('benchmarking', 'Decision Benchmarking', 'Vergleich mit Best Practices', false, 'intelligence'),
  ('scenarios', 'Scenario Engine', 'Szenarien durchspielen', false, 'intelligence'),
  ('timeline', 'Predictive Timeline', 'Prädiktive Zeitplanung', false, 'intelligence'),
  ('strategy', 'Strategy Linking', 'Entscheidungen mit Zielen verknüpfen', true, 'intelligence'),
  ('warroom', 'War Room', 'Kritische Entscheidungen managen', true, 'admin'),
  ('teams', 'Teams', 'Team-Verwaltung und Kollaboration', true, 'core'),
  ('audit', 'Audit Trail', 'Vollständige Änderungshistorie', true, 'core');

-- Trigger for updated_at
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
