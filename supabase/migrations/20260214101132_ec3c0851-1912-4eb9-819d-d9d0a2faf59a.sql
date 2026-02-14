
-- Add columns for Impact Tracker
ALTER TABLE public.decisions
ADD COLUMN IF NOT EXISTS actual_impact_score integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS outcome_notes text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS implemented_at timestamp with time zone DEFAULT NULL;

-- Add column for AI Autopilot options
ALTER TABLE public.decisions
ADD COLUMN IF NOT EXISTS ai_options jsonb DEFAULT NULL;

-- Add escalation tracking
ALTER TABLE public.decisions
ADD COLUMN IF NOT EXISTS escalation_level integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_escalated_at timestamp with time zone DEFAULT NULL;

-- Create notifications table for escalations
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  decision_id uuid REFERENCES public.decisions(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'escalation',
  title text NOT NULL,
  message text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Enable pg_cron and pg_net for scheduled escalation checks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
