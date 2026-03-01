
-- External review tokens for reviewers without accounts
CREATE TABLE public.external_review_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id uuid NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  reviewer_name text NOT NULL,
  reviewer_email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  feedback text,
  action_taken text,
  acted_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.external_review_tokens ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view tokens for decisions they own/created
CREATE POLICY "Users can view tokens for their decisions"
  ON public.external_review_tokens FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM decisions d
      WHERE d.id = external_review_tokens.decision_id
        AND (d.created_by = auth.uid() OR d.owner_id = auth.uid() OR d.assignee_id = auth.uid())
    )
  );

-- Users can create tokens for decisions they own
CREATE POLICY "Users can create external review tokens"
  ON public.external_review_tokens FOR INSERT
  WITH CHECK (auth.uid() = invited_by);

-- Public access not needed via RLS — edge function uses service role

CREATE INDEX idx_external_review_tokens_token ON public.external_review_tokens(token);
CREATE INDEX idx_external_review_tokens_decision ON public.external_review_tokens(decision_id);
