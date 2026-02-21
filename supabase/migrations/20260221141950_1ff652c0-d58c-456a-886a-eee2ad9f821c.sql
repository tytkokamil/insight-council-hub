
-- Automation Rules table
CREATE TABLE public.automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL, -- 'decision_created', 'status_changed', 'priority_changed', 'review_overdue', 'stakeholder_oppose'
  condition_field TEXT NOT NULL, -- 'priority', 'category', 'status', 'oppose_count', 'review_days', 'budget_amount'
  condition_operator TEXT NOT NULL DEFAULT 'equals', -- 'equals', 'greater_than', 'less_than', 'contains'
  condition_value TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'set_sla_days', 'escalate', 'add_reviewer', 'change_priority', 'send_notification', 'change_status'
  action_value TEXT NOT NULL, -- JSON or simple value depending on action_type
  enabled BOOLEAN NOT NULL DEFAULT true,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE, -- NULL = global rule
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

-- Org admins can manage all rules
CREATE POLICY "Org admins can manage automation rules"
  ON public.automation_rules
  FOR ALL
  USING (is_org_admin_or_owner(auth.uid()));

-- Team leads/admins can view rules for their teams
CREATE POLICY "Team members can view team rules"
  ON public.automation_rules
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      team_id IS NULL OR
      EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = automation_rules.team_id AND team_members.user_id = auth.uid())
    )
  );

-- Team admins/leads can manage their team's rules
CREATE POLICY "Team admins can manage team rules"
  ON public.automation_rules
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND (
      team_id IS NULL AND is_org_admin_or_owner(auth.uid()) OR
      team_id IS NOT NULL AND is_team_lead_or_admin(auth.uid(), team_id)
    )
  );

CREATE POLICY "Team admins can update team rules"
  ON public.automation_rules
  FOR UPDATE
  USING (
    is_org_admin_or_owner(auth.uid()) OR
    (team_id IS NOT NULL AND is_team_lead_or_admin(auth.uid(), team_id))
  );

CREATE POLICY "Team admins can delete team rules"
  ON public.automation_rules
  FOR DELETE
  USING (
    is_org_admin_or_owner(auth.uid()) OR
    (team_id IS NOT NULL AND is_team_lead_or_admin(auth.uid(), team_id))
  );

-- Automation rule execution log
CREATE TABLE public.automation_rule_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  action_taken TEXT NOT NULL,
  details TEXT,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_rule_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view rule logs"
  ON public.automation_rule_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert rule logs"
  ON public.automation_rule_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to evaluate automation rules on decision changes
CREATE OR REPLACE FUNCTION public.evaluate_automation_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rule RECORD;
  field_val TEXT;
  condition_met BOOLEAN;
  new_due DATE;
BEGIN
  FOR rule IN
    SELECT * FROM automation_rules
    WHERE enabled = true
      AND (team_id IS NULL OR team_id = NEW.team_id)
  LOOP
    -- Get the field value to compare
    CASE rule.condition_field
      WHEN 'priority' THEN field_val := NEW.priority::TEXT;
      WHEN 'category' THEN field_val := NEW.category::TEXT;
      WHEN 'status' THEN field_val := NEW.status::TEXT;
      ELSE field_val := NULL;
    END CASE;

    IF field_val IS NULL THEN CONTINUE; END IF;

    -- Evaluate condition
    condition_met := false;
    CASE rule.condition_operator
      WHEN 'equals' THEN condition_met := (field_val = rule.condition_value);
      WHEN 'not_equals' THEN condition_met := (field_val != rule.condition_value);
      WHEN 'contains' THEN condition_met := (field_val ILIKE '%' || rule.condition_value || '%');
      ELSE condition_met := false;
    END CASE;

    -- Check trigger event matches
    IF rule.trigger_event = 'decision_created' AND TG_OP != 'INSERT' THEN CONTINUE; END IF;
    IF rule.trigger_event = 'status_changed' AND (TG_OP != 'UPDATE' OR OLD.status = NEW.status) THEN CONTINUE; END IF;
    IF rule.trigger_event = 'priority_changed' AND (TG_OP != 'UPDATE' OR OLD.priority = NEW.priority) THEN CONTINUE; END IF;

    IF condition_met THEN
      -- Execute action
      CASE rule.action_type
        WHEN 'set_sla_days' THEN
          new_due := CURRENT_DATE + (rule.action_value::INTEGER);
          IF NEW.due_date IS NULL OR new_due < NEW.due_date THEN
            NEW.due_date := new_due;
          END IF;
        WHEN 'change_priority' THEN
          NEW.priority := rule.action_value::decision_priority;
        WHEN 'escalate' THEN
          NEW.escalation_level := COALESCE(NEW.escalation_level, 0) + 1;
          NEW.last_escalated_at := now();
        WHEN 'change_status' THEN
          NEW.status := rule.action_value::decision_status;
        WHEN 'send_notification' THEN
          -- Create notification for the decision creator
          INSERT INTO notifications (user_id, title, message, type, decision_id)
          VALUES (
            NEW.created_by,
            'Automation: ' || rule.name,
            rule.action_value,
            'automation',
            NEW.id
          );
        ELSE NULL;
      END CASE;

      -- Log execution
      INSERT INTO automation_rule_logs (rule_id, decision_id, action_taken, details)
      VALUES (rule.id, NEW.id, rule.action_type, 'Regel "' || rule.name || '" ausgeführt: ' || rule.action_type || ' → ' || rule.action_value);
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Attach trigger to decisions table
CREATE TRIGGER evaluate_automation_rules_trigger
  BEFORE INSERT OR UPDATE ON public.decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.evaluate_automation_rules();
