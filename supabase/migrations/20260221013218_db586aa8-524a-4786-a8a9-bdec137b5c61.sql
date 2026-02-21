
-- Function to parse @mentions from comment content and create notifications
CREATE OR REPLACE FUNCTION public.handle_comment_mentions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mention_match TEXT;
  mentioned_user_id UUID;
  author_name TEXT;
  decision_title TEXT;
BEGIN
  -- Get author name
  SELECT full_name INTO author_name FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;
  
  -- Get decision title
  SELECT title INTO decision_title FROM public.decisions WHERE id = NEW.decision_id LIMIT 1;

  -- Find all @mentions (pattern: @[Name](user_id))
  FOR mention_match IN
    SELECT (regexp_matches(NEW.content, '@\[([^\]]+)\]\(([a-f0-9\-]{36})\)', 'g'))[2]
  LOOP
    mentioned_user_id := mention_match::UUID;
    
    -- Don't notify the author themselves
    IF mentioned_user_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, title, message, type, decision_id)
      VALUES (
        mentioned_user_id,
        'Erwähnung von ' || COALESCE(author_name, 'Unbekannt'),
        COALESCE(author_name, 'Jemand') || ' hat dich in "' || COALESCE(decision_title, 'Entscheidung') || '" erwähnt.',
        'mention',
        NEW.decision_id
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger on comments insert
CREATE TRIGGER on_comment_insert_parse_mentions
AFTER INSERT ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.handle_comment_mentions();
