
-- Create task status enum
CREATE TYPE public.task_status AS ENUM ('open', 'in_progress', 'done');

-- Create task priority enum (reuse decision priority concept)
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Create task category enum
CREATE TYPE public.task_category AS ENUM ('general', 'strategic', 'operational', 'technical', 'hr', 'marketing', 'budget');

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status NOT NULL DEFAULT 'open',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  category public.task_category NOT NULL DEFAULT 'general',
  due_date DATE,
  created_by UUID NOT NULL,
  assignee_id UUID,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies (mirroring decisions pattern)
CREATE POLICY "Team-based task visibility"
  ON public.tasks FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      team_id IS NULL
      OR created_by = auth.uid()
      OR assignee_id = auth.uid()
      OR EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = tasks.team_id AND team_members.user_id = auth.uid())
      OR has_role(auth.uid(), 'admin'::user_role)
    )
  );

CREATE POLICY "Users can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators and assignees can update"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = created_by OR auth.uid() = assignee_id);

CREATE POLICY "Creators can delete"
  ON public.tasks FOR DELETE
  USING (auth.uid() = created_by);

-- Trigger for updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
