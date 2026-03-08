
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_reengagement_opt_out boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_seen_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS reengagement_7d_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reengagement_14d_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reengagement_30d_sent boolean DEFAULT false;
