
-- Drop dependent policies first
DROP POLICY IF EXISTS "Admins can manage teams" ON public.teams;
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'observer',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view all roles" ON public.user_roles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (
  public.has_role(auth.uid(), 'admin')
);

-- Now remove role from profiles
ALTER TABLE public.profiles DROP COLUMN role;

-- Recreate policies using has_role
CREATE POLICY "Admins can manage teams" ON public.teams FOR ALL USING (
  public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admins can manage team members" ON public.team_members FOR ALL USING (
  public.has_role(auth.uid(), 'admin')
);

-- Update handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
  assigned_role public.user_role;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'observer';
  END IF;
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
