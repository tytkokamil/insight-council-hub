
-- 1. Create triggers for @mention notifications on comments and team messages
CREATE TRIGGER on_comment_mention
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_comment_mentions();

CREATE TRIGGER on_team_message_mention
  AFTER INSERT ON public.team_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_team_message_mentions();

-- 2. Add notification preference columns for watchlist and gamification
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS watchlist_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS gamification_enabled boolean NOT NULL DEFAULT true;

-- 3. Add backup_codes column to mfa_settings for MFA backup codes
ALTER TABLE public.mfa_settings
  ADD COLUMN IF NOT EXISTS backup_codes text[] DEFAULT '{}';
