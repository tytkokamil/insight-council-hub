-- Clean up duplicate triggers (keep the newer named ones)

-- decisions: remove duplicate increment trigger
DROP TRIGGER IF EXISTS trg_increment_decision_count ON public.decisions;

-- audit_logs: remove old duplicate triggers  
DROP TRIGGER IF EXISTS trg_audit_logs_hash_chain ON public.audit_logs;
DROP TRIGGER IF EXISTS trg_audit_logs_no_delete ON public.audit_logs;
DROP TRIGGER IF EXISTS trg_audit_logs_no_update ON public.audit_logs;

-- comments: remove old duplicate mention triggers
DROP TRIGGER IF EXISTS on_comment_insert_parse_mentions ON public.comments;
DROP TRIGGER IF EXISTS on_comment_mention ON public.comments;

-- team_messages: remove old duplicate mention triggers
DROP TRIGGER IF EXISTS on_team_message_insert_parse_mentions ON public.team_messages;
DROP TRIGGER IF EXISTS on_team_message_mention ON public.team_messages;

-- email_otp_codes: remove old duplicate cleanup trigger
DROP TRIGGER IF EXISTS trg_cleanup_otp ON public.email_otp_codes;