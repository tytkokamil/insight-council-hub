
-- Decision Watchlist / Follow system
CREATE TABLE public.decision_watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, decision_id)
);

ALTER TABLE public.decision_watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlist"
ON public.decision_watchlist FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own watchlist"
ON public.decision_watchlist FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from own watchlist"
ON public.decision_watchlist FOR DELETE
USING (auth.uid() = user_id);
