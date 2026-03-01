-- Skip trigger 1 (on_auth_user_created already exists on auth.users)

-- TRIGGER 2: audit_logs_hash_chain
DROP TRIGGER IF EXISTS audit_logs_hash_chain_trigger ON public.audit_logs;
CREATE TRIGGER audit_logs_hash_chain_trigger
  BEFORE INSERT ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_logs_hash_chain();

-- TRIGGER 3: audit_logs_immutable
DROP TRIGGER IF EXISTS audit_logs_immutable_trigger ON public.audit_logs;
CREATE TRIGGER audit_logs_immutable_trigger
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_logs_immutable();

-- TRIGGER 4: increment_decision_count
DROP TRIGGER IF EXISTS increment_decision_count_trigger ON public.decisions;
CREATE TRIGGER increment_decision_count_trigger
  AFTER INSERT ON public.decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_decision_count();

-- TRIGGER 5: evaluate_automation_rules
DROP TRIGGER IF EXISTS evaluate_automation_rules_trigger ON public.decisions;
CREATE TRIGGER evaluate_automation_rules_trigger
  BEFORE INSERT OR UPDATE ON public.decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.evaluate_automation_rules();

-- TRIGGER 6: auto_implement_decision
DROP TRIGGER IF EXISTS auto_implement_decision_trigger ON public.tasks;
CREATE TRIGGER auto_implement_decision_trigger
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_implement_decision();

-- TRIGGER 7: handle_comment_mentions
DROP TRIGGER IF EXISTS handle_comment_mentions_trigger ON public.comments;
CREATE TRIGGER handle_comment_mentions_trigger
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_comment_mentions();

-- TRIGGER 8: handle_team_message_mentions
DROP TRIGGER IF EXISTS handle_team_message_mentions_trigger ON public.team_messages;
CREATE TRIGGER handle_team_message_mentions_trigger
  AFTER INSERT ON public.team_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_team_message_mentions();

-- TRIGGER 9: handle_team_invitation_on_signup
DROP TRIGGER IF EXISTS handle_team_invitation_on_signup_trigger ON public.profiles;
CREATE TRIGGER handle_team_invitation_on_signup_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_team_invitation_on_signup();

-- TRIGGER 10: cleanup_expired_otp
DROP TRIGGER IF EXISTS cleanup_expired_otp_trigger ON public.email_otp_codes;
CREATE TRIGGER cleanup_expired_otp_trigger
  AFTER INSERT ON public.email_otp_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_expired_otp();

-- TRIGGER 11: validate_dependency_refs
DROP TRIGGER IF EXISTS validate_dependency_refs_trigger ON public.decision_dependencies;
CREATE TRIGGER validate_dependency_refs_trigger
  BEFORE INSERT OR UPDATE ON public.decision_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_dependency_refs();

-- REALTIME: Add meeting_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'meeting_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_sessions;
  END IF;
END $$;