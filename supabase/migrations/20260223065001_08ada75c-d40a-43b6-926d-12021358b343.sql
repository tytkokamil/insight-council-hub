
-- Extend evaluate_automation_rules to support ai_risk_score as condition_field
CREATE OR REPLACE FUNCTION public.evaluate_automation_rules()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
      WHEN 'ai_risk_score' THEN field_val := COALESCE(NEW.ai_risk_score, 0)::TEXT;
      ELSE field_val := NULL;
    END CASE;

    IF field_val IS NULL THEN CONTINUE; END IF;

    -- Evaluate condition
    condition_met := false;
    CASE rule.condition_operator
      WHEN 'equals' THEN condition_met := (field_val = rule.condition_value);
      WHEN 'not_equals' THEN condition_met := (field_val != rule.condition_value);
      WHEN 'contains' THEN condition_met := (field_val ILIKE '%' || rule.condition_value || '%');
      WHEN 'greater_than' THEN condition_met := (field_val::NUMERIC > rule.condition_value::NUMERIC);
      WHEN 'less_than' THEN condition_met := (field_val::NUMERIC < rule.condition_value::NUMERIC);
      ELSE condition_met := false;
    END CASE;

    -- Check trigger event matches
    IF rule.trigger_event = 'decision_created' AND TG_OP != 'INSERT' THEN CONTINUE; END IF;
    IF rule.trigger_event = 'status_changed' AND (TG_OP != 'UPDATE' OR OLD.status = NEW.status) THEN CONTINUE; END IF;
    IF rule.trigger_event = 'priority_changed' AND (TG_OP != 'UPDATE' OR OLD.priority = NEW.priority) THEN CONTINUE; END IF;
    IF rule.trigger_event = 'risk_score_changed' AND (TG_OP != 'UPDATE' OR COALESCE(OLD.ai_risk_score, 0) = COALESCE(NEW.ai_risk_score, 0)) THEN CONTINUE; END IF;

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
$function$;
