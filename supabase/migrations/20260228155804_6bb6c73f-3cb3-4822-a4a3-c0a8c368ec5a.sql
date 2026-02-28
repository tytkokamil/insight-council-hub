
CREATE OR REPLACE FUNCTION public.transfer_ownership(_current_owner_id uuid, _new_owner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is actually the current owner
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _current_owner_id AND role = 'org_owner'
  ) THEN
    RAISE EXCEPTION 'Only the current owner can transfer ownership';
  END IF;

  -- Verify target user exists
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = _new_owner_id
  ) THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  -- Cannot transfer to self
  IF _current_owner_id = _new_owner_id THEN
    RAISE EXCEPTION 'Cannot transfer ownership to yourself';
  END IF;

  -- Atomic swap: new owner gets org_owner, old owner becomes org_admin
  UPDATE public.user_roles SET role = 'org_owner' WHERE user_id = _new_owner_id;
  UPDATE public.user_roles SET role = 'org_admin' WHERE user_id = _current_owner_id;
END;
$$;
