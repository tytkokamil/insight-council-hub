
-- Add granular notification matrix as JSONB column
-- Each key is an event, value is { in_app: bool, email: bool, push: bool, whatsapp: bool, frequency: 'instant'|'daily'|'weekly'|'never' }
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS notification_matrix jsonb NOT NULL DEFAULT '{}'::jsonb;
