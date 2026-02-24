
-- 1. decision_votes: Abstimmungen im Decision Room
CREATE TABLE public.decision_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id uuid NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  vote text NOT NULL CHECK (vote IN ('approve', 'reject', 'defer', 'abstain')),
  comment text,
  session_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (decision_id, user_id, session_id)
);

ALTER TABLE public.decision_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view votes"
  ON public.decision_votes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can cast own vote"
  ON public.decision_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vote"
  ON public.decision_votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vote"
  ON public.decision_votes FOR DELETE
  USING (auth.uid() = user_id);

-- 2. meeting_sessions: Decision Room Sessions
CREATE TABLE public.meeting_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  team_id uuid REFERENCES public.teams(id),
  created_by uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meeting_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view sessions"
  ON public.meeting_sessions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create sessions"
  ON public.meeting_sessions FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update sessions"
  ON public.meeting_sessions FOR UPDATE
  USING (auth.uid() = created_by OR is_org_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can delete sessions"
  ON public.meeting_sessions FOR DELETE
  USING (is_org_admin_or_owner(auth.uid()));

-- 3. gamification_scores: Punkte, Streaks, Level
CREATE TABLE public.gamification_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  total_points integer NOT NULL DEFAULT 0,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  level text NOT NULL DEFAULT 'bronze' CHECK (level IN ('bronze', 'silver', 'gold', 'platinum')),
  last_activity_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gamification_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all scores"
  ON public.gamification_scores FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own score"
  ON public.gamification_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own score"
  ON public.gamification_scores FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. user_badges: Earned badges
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_key text NOT NULL,
  badge_label text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_key)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. active_sessions: Session-Management für Security Center
CREATE TABLE public.active_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_info text,
  ip_address text,
  user_agent text,
  last_active_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  is_current boolean NOT NULL DEFAULT false,
  revoked boolean NOT NULL DEFAULT false
);

ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON public.active_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own session"
  ON public.active_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.active_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON public.active_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger to gamification_scores
CREATE TRIGGER update_gamification_scores_updated_at
  BEFORE UPDATE ON public.gamification_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
