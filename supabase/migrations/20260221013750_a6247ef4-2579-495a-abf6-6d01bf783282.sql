
-- Trigger to parse @mentions from team_messages and create notifications
CREATE OR REPLACE FUNCTION public.handle_team_message_mentions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mention_match TEXT;
  mentioned_user_id UUID;
  author_name TEXT;
  team_name_val TEXT;
BEGIN
  -- Get author name
  SELECT full_name INTO author_name FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1;
  
  -- Get team name
  SELECT name INTO team_name_val FROM public.teams WHERE id = NEW.team_id LIMIT 1;

  -- Find all @mentions (pattern: @[Name](user_id))
  FOR mention_match IN
    SELECT (regexp_matches(NEW.content, '@\[([^\]]+)\]\(([a-f0-9\-]{36})\)', 'g'))[2]
  LOOP
    mentioned_user_id := mention_match::UUID;
    
    -- Don't notify the author themselves
    IF mentioned_user_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (
        mentioned_user_id,
        'Erwähnung in ' || COALESCE(team_name_val, 'Team-Chat'),
        COALESCE(author_name, 'Jemand') || ' hat dich im Chat von "' || COALESCE(team_name_val, 'Team') || '" erwähnt.',
        'mention'
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger on team_messages insert
CREATE TRIGGER on_team_message_insert_parse_mentions
AFTER INSERT ON public.team_messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_team_message_mentions();
