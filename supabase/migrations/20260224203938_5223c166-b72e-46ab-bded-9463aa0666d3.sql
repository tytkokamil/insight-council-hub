
-- Performance indexes for RBAC RLS policies

-- user_roles: fast lookup by user_id (used in every has_role/has_min_role call)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles (user_id, role);

-- role_permissions: fast lookup by role + permission
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions (role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_perm ON public.role_permissions (role, permission);
CREATE INDEX IF NOT EXISTS idx_role_permissions_org_role ON public.role_permissions (org_id, role);

-- team_members: frequently used in RLS subqueries
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members (user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_user ON public.team_members (team_id, user_id);

-- profiles: fast org_id lookup for permission resolution
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles (user_id);
