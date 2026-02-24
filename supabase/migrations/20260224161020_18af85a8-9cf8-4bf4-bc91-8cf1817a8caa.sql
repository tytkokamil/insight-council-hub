-- Just re-enable RLS and add policies (skip the constraint that already exists)
-- Check if policies exist first by using IF NOT EXISTS pattern via DO block
DO $$
BEGIN
  -- Enable RLS (idempotent)
  ALTER TABLE public.gamification_scores ENABLE ROW LEVEL SECURITY;
  
  -- Create policies only if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gamification_scores' AND policyname = 'Users can view own scores') THEN
    CREATE POLICY "Users can view own scores" ON public.gamification_scores FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gamification_scores' AND policyname = 'Users can insert own scores') THEN
    CREATE POLICY "Users can insert own scores" ON public.gamification_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gamification_scores' AND policyname = 'Users can update own scores') THEN
    CREATE POLICY "Users can update own scores" ON public.gamification_scores FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;