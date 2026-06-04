-- Migration 008: Auth Redesign
-- 1. Add email to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- 2. Make admin_audit_logs admin_id nullable for system actions
ALTER TABLE public.admin_audit_logs
  ALTER COLUMN admin_id DROP NOT NULL;

-- 3. Create function to get orphaned users
CREATE OR REPLACE FUNCTION public.get_orphan_users()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz,
  raw_user_meta_data jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT au.id, au.email::text, au.created_at, au.raw_user_meta_data
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL;
END;
$$;

-- 4. Create function to manually repair a user
CREATE OR REPLACE FUNCTION public.repair_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_meta jsonb;
  v_name text;
  v_roll_no text;
  v_programme text;
  v_batch_year int;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get auth.users details
  SELECT email, raw_user_meta_data INTO v_email, v_meta
  FROM auth.users
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found in auth.users';
  END IF;

  v_name := v_meta->>'name';
  v_roll_no := v_meta->>'rollNo';
  v_programme := v_meta->>'programme';
  v_batch_year := (v_meta->>'batch_year')::int;

  IF v_name IS NULL OR v_roll_no IS NULL OR v_programme IS NULL OR v_batch_year IS NULL THEN
    RAISE EXCEPTION 'Missing metadata in auth.users';
  END IF;

  -- Insert profile
  INSERT INTO public.profiles (id, roll_no, name, programme, batch_year, status, role, email)
  VALUES (target_user_id, v_roll_no, v_name, v_programme, v_batch_year, 'pending', 'student', v_email)
  ON CONFLICT (id) DO NOTHING;

  -- Log action
  INSERT INTO public.admin_audit_logs (admin_id, action_type, target_id, target_type, details)
  VALUES (auth.uid(), 'User Repair (Admin Manual Repair)', target_user_id::text, 'Profile', jsonb_build_object('roll_no', v_roll_no, 'email', v_email));

  RETURN TRUE;
END;
$$;
