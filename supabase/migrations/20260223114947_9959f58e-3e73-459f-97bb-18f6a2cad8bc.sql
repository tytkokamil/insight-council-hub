-- Add granular notification frequency preferences
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS mention_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deadline_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS status_change_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS digest_frequency text NOT NULL DEFAULT 'instant';

-- digest_frequency: 'instant' | 'daily' | 'weekly' | 'off'
COMMENT ON COLUMN public.notification_preferences.digest_frequency IS 'Controls notification delivery: instant, daily, weekly, off';