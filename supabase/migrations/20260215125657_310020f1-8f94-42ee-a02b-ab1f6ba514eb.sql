
-- Make existing decision columns nullable to allow task-only dependencies
ALTER TABLE public.decision_dependencies
  ALTER COLUMN source_decision_id DROP NOT NULL,
  ALTER COLUMN target_decision_id DROP NOT NULL;

-- Add task reference columns
ALTER TABLE public.decision_dependencies
  ADD COLUMN source_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  ADD COLUMN target_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE;

-- Validation trigger: at least one source and one target must be set
CREATE OR REPLACE FUNCTION public.validate_dependency_refs()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.source_decision_id IS NULL AND NEW.source_task_id IS NULL THEN
    RAISE EXCEPTION 'Either source_decision_id or source_task_id must be set';
  END IF;
  IF NEW.target_decision_id IS NULL AND NEW.target_task_id IS NULL THEN
    RAISE EXCEPTION 'Either target_decision_id or target_task_id must be set';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_dependency_refs_trigger
BEFORE INSERT OR UPDATE ON public.decision_dependencies
FOR EACH ROW EXECUTE FUNCTION public.validate_dependency_refs();

-- Auto-implement trigger: when all tasks linked to a decision are done, set decision to 'implemented'
CREATE OR REPLACE FUNCTION public.auto_implement_decision()
RETURNS TRIGGER AS $$
DECLARE
  linked_decision_id UUID;
  all_done BOOLEAN;
BEGIN
  IF NEW.status != 'done' OR (OLD IS NOT NULL AND OLD.status = NEW.status) THEN
    RETURN NEW;
  END IF;

  -- Find decisions linked to this task via dependencies (task as source or target)
  FOR linked_decision_id IN
    SELECT DISTINCT d_id FROM (
      SELECT source_decision_id AS d_id FROM decision_dependencies
      WHERE target_task_id = NEW.id AND source_decision_id IS NOT NULL
      UNION
      SELECT target_decision_id AS d_id FROM decision_dependencies
      WHERE source_task_id = NEW.id AND target_decision_id IS NOT NULL
    ) sub
  LOOP
    -- Check if ALL tasks linked to this decision are done
    SELECT NOT EXISTS (
      SELECT 1
      FROM decision_dependencies dd
      JOIN tasks t ON t.id = COALESCE(
        CASE WHEN dd.source_decision_id = linked_decision_id THEN dd.target_task_id END,
        CASE WHEN dd.target_decision_id = linked_decision_id THEN dd.source_task_id END
      )
      WHERE (dd.source_decision_id = linked_decision_id OR dd.target_decision_id = linked_decision_id)
        AND COALESCE(
          CASE WHEN dd.source_decision_id = linked_decision_id THEN dd.target_task_id END,
          CASE WHEN dd.target_decision_id = linked_decision_id THEN dd.source_task_id END
        ) IS NOT NULL
        AND t.status != 'done'
    ) INTO all_done;

    IF all_done THEN
      UPDATE decisions
      SET status = 'implemented', implemented_at = now(), updated_at = now()
      WHERE id = linked_decision_id
        AND status NOT IN ('implemented', 'rejected');
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER auto_implement_decision_trigger
AFTER UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.auto_implement_decision();

-- Update INSERT policy to support task-based dependencies
DROP POLICY "Decision owners can create dependencies" ON public.decision_dependencies;

CREATE POLICY "Owners can create dependencies"
ON public.decision_dependencies
FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND (
    -- Source is a decision the user owns
    (source_decision_id IS NOT NULL AND EXISTS(
      SELECT 1 FROM decisions WHERE id = source_decision_id
      AND (created_by = auth.uid() OR assignee_id = auth.uid())
    ))
    OR
    -- Source is a task the user owns
    (source_task_id IS NOT NULL AND EXISTS(
      SELECT 1 FROM tasks WHERE id = source_task_id
      AND (created_by = auth.uid() OR assignee_id = auth.uid())
    ))
    OR
    has_role(auth.uid(), 'admin'::user_role)
  )
);
