
-- Table for one-time-use email action tokens
CREATE TABLE public.email_action_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  decision_id uuid NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  review_id uuid NOT NULL REFERENCES public.decision_reviews(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('approve', 'reject')),
  used boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  feedback text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  token text NOT NULL UNIQUE
);

ALTER TABLE public.email_action_tokens ENABLE ROW LEVEL SECURITY;

-- Edge functions use service role, so no RLS policies needed for normal access
-- But allow users to read their own tokens for verification
CREATE POLICY "Users can view own tokens"
  ON public.email_action_tokens FOR SELECT
  USING (auth.uid() = user_id);
