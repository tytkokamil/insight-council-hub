
-- Roadmap items managed by platform admins
CREATE TABLE public.roadmap_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('considering','planned','in_progress','released','rejected')),
  category text CHECK (category IN ('feature','improvement','integration','compliance')),
  vote_count integer NOT NULL DEFAULT 0,
  planned_quarter text,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Public votes by email (no account required)
CREATE TABLE public.roadmap_votes (
  item_id uuid NOT NULL REFERENCES public.roadmap_items(id) ON DELETE CASCADE,
  voter_email text NOT NULL,
  voted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (item_id, voter_email)
);

-- RLS
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can read roadmap items (public page)
CREATE POLICY "Public read roadmap items"
  ON public.roadmap_items FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only platform admins can manage roadmap items
CREATE POLICY "Admins manage roadmap items"
  ON public.roadmap_items FOR ALL
  TO authenticated
  USING (public.is_platform_admin(auth.uid()))
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Anyone can read vote counts
CREATE POLICY "Public read roadmap votes"
  ON public.roadmap_votes FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can insert votes (email-based)
CREATE POLICY "Anyone can vote"
  ON public.roadmap_votes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Trigger to keep vote_count in sync
CREATE OR REPLACE FUNCTION public.update_roadmap_vote_count()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE roadmap_items SET vote_count = vote_count + 1 WHERE id = NEW.item_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE roadmap_items SET vote_count = vote_count - 1 WHERE id = OLD.item_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_roadmap_vote_count
  AFTER INSERT OR DELETE ON public.roadmap_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_roadmap_vote_count();

-- Updated_at trigger
CREATE TRIGGER trg_roadmap_items_updated_at
  BEFORE UPDATE ON public.roadmap_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
