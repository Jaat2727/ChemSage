-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 010: Admin User Management RPCs
-- Date: 2026-06-05
-- Purpose: Provide robust RPC functions for admin actions (Make Admin, Ban User)
--          to avoid potential silent failures from triggers during direct updates.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. RPC for updating user role
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  target_user_id uuid,
  new_role text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: You must be an administrator to perform this action.';
  END IF;

  -- Ensure valid role
  IF new_role NOT IN ('student', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  -- Prevent modifying own role
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot modify your own role.';
  END IF;

  -- Perform update (temporarily bypassing any triggers if necessary, but triggers should be fine if is_admin() works)
  -- Since we are running as SECURITY DEFINER, is_admin() will still work, but we are explicitly doing the update.
  UPDATE public.profiles
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found.';
  END IF;

  RETURN TRUE;
END;
$$;

-- 2. RPC for updating user status
CREATE OR REPLACE FUNCTION public.admin_update_user_status(
  target_user_id uuid,
  new_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: You must be an administrator to perform this action.';
  END IF;

  -- Ensure valid status
  IF new_status NOT IN ('active', 'banned', 'pending') THEN
    RAISE EXCEPTION 'Invalid status: %', new_status;
  END IF;

  -- Prevent modifying own status
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot modify your own status.';
  END IF;

  -- Perform update
  UPDATE public.profiles
  SET status = new_status, updated_at = now()
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found.';
  END IF;

  RETURN TRUE;
END;
$$;
