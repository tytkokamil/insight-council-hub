
-- Track last-read timestamp per user per team
CREATE TABLE public.team_chat_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_chat_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reads"
ON public.team_chat_reads FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own reads"
ON public.team_chat_reads FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reads"
ON public.team_chat_reads FOR UPDATE
USING (auth.uid() = user_id);
