
-- Create decision_templates table to persist template configurations
CREATE TABLE public.decision_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'operational',
  priority TEXT NOT NULL DEFAULT 'medium',
  description TEXT NOT NULL DEFAULT '',
  default_duration_days INTEGER NOT NULL DEFAULT 7,
  required_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  approval_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  conditional_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  governance_notes TEXT,
  when_to_use TEXT,
  icon_color TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.decision_templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view templates
CREATE POLICY "Authenticated users can view templates"
  ON public.decision_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Org admins can create templates
CREATE POLICY "Admins can create templates"
  ON public.decision_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by AND is_org_admin_or_owner(auth.uid()));

-- Org admins can update templates
CREATE POLICY "Admins can update templates"
  ON public.decision_templates FOR UPDATE
  USING (is_org_admin_or_owner(auth.uid()));

-- Org admins can delete non-system templates
CREATE POLICY "Admins can delete templates"
  ON public.decision_templates FOR DELETE
  USING (is_org_admin_or_owner(auth.uid()) AND NOT is_system);

-- Trigger for updated_at
CREATE TRIGGER update_decision_templates_updated_at
  BEFORE UPDATE ON public.decision_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
