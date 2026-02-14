
-- Team messages table
CREATE TABLE public.team_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  decision_id uuid REFERENCES public.decisions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_team_messages_team_id ON public.team_messages(team_id);
CREATE INDEX idx_team_messages_created_at ON public.team_messages(created_at);

-- Enable RLS
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;

-- Only team members can view messages
CREATE POLICY "Team members can view messages"
ON public.team_messages FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = team_messages.team_id AND team_members.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::user_role)
  )
);

-- Only team members can send messages
CREATE POLICY "Team members can send messages"
ON public.team_messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND (
    EXISTS (SELECT 1 FROM team_members WHERE team_members.team_id = team_messages.team_id AND team_members.user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::user_role)
  )
);

-- Users can delete own messages
CREATE POLICY "Users can delete own messages"
ON public.team_messages FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_messages;
