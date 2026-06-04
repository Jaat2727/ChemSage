-- ═══════════════════════════════════════════════════════════════════════════
-- ChemSAGE Profile & Account Management Hardening
-- Date: 2026-06-04
-- Purpose: Data integrity, storage security, activity triggers, and analytics
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. DATABASE INTEGRITY & TRIGGERS ─────────────────────────────────────

-- Ensure profiles ID is strictly unique (primary key already enforces this, but explicit constraint doesn't hurt)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_key;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_key UNIQUE (id);

-- Automatic Profile Creation from Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, status)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'Student'), new.email, 'active')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Updated_at auto-update trigger for profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();


-- ─── 2. STORAGE SECURITY & BUCKETS ────────────────────────────────────────

-- Ensure buckets exist
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true) ON CONFLICT (id) DO NOTHING;

-- Avatars Policies (Locking to {user_id}.webp style naming)
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
CREATE POLICY "Avatar public read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar user insert" ON storage.objects;
CREATE POLICY "Avatar user insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (string_to_array(name, '.'))[1]);

DROP POLICY IF EXISTS "Avatar user update" ON storage.objects;
CREATE POLICY "Avatar user update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (string_to_array(name, '.'))[1]);

DROP POLICY IF EXISTS "Avatar user delete" ON storage.objects;
CREATE POLICY "Avatar user delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (string_to_array(name, '.'))[1]);

-- Banners Policies
DROP POLICY IF EXISTS "Banner public read" ON storage.objects;
CREATE POLICY "Banner public read" ON storage.objects FOR SELECT USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "Banner user insert" ON storage.objects;
CREATE POLICY "Banner user insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners' AND auth.uid()::text = (string_to_array(name, '.'))[1]);

DROP POLICY IF EXISTS "Banner user update" ON storage.objects;
CREATE POLICY "Banner user update" ON storage.objects FOR UPDATE USING (bucket_id = 'banners' AND auth.uid()::text = (string_to_array(name, '.'))[1]);

DROP POLICY IF EXISTS "Banner user delete" ON storage.objects;
CREATE POLICY "Banner user delete" ON storage.objects FOR DELETE USING (bucket_id = 'banners' AND auth.uid()::text = (string_to_array(name, '.'))[1]);


-- ─── 3. EXTENDED ACTIVITY FEED TRIGGERS ───────────────────────────────────

-- Resource Edited
CREATE OR REPLACE FUNCTION public.log_resource_edited() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.updated_at != OLD.updated_at AND NEW.status = 'active' THEN
    INSERT INTO public.activity_feed (user_id, action_type, target_type, target_id, details)
    VALUES (NEW.uploaded_by, 'edit_resource', 'resource', NEW.id::text, jsonb_build_object('title', NEW.title));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_resource_edited ON public.resources;
CREATE TRIGGER on_resource_edited
  AFTER UPDATE OF updated_at ON public.resources
  FOR EACH ROW EXECUTE PROCEDURE public.log_resource_edited();

-- Paper Uploaded/Updated
CREATE OR REPLACE FUNCTION public.log_paper_activity() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    INSERT INTO public.activity_feed (user_id, action_type, target_type, target_id, details)
    VALUES (NEW.uploaded_by, 'upload_paper', 'paper', NEW.id::text, jsonb_build_object('subject', NEW.subject));
  ELSIF TG_OP = 'UPDATE' AND NEW.updated_at != OLD.updated_at AND NEW.status = 'active' THEN
    INSERT INTO public.activity_feed (user_id, action_type, target_type, target_id, details)
    VALUES (NEW.uploaded_by, 'edit_paper', 'paper', NEW.id::text, jsonb_build_object('subject', NEW.subject));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_paper_activity ON public.exam_papers;
CREATE TRIGGER on_paper_activity
  AFTER INSERT OR UPDATE OF status, updated_at ON public.exam_papers
  FOR EACH ROW EXECUTE PROCEDURE public.log_paper_activity();

-- Profile Updated
CREATE OR REPLACE FUNCTION public.log_profile_updated() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.updated_at != OLD.updated_at THEN
    -- Only log major profile updates to avoid spam
    IF (NEW.avatar_url IS DISTINCT FROM OLD.avatar_url) OR (NEW.bio IS DISTINCT FROM OLD.bio) THEN
      INSERT INTO public.activity_feed (user_id, action_type, target_type, target_id, details)
      VALUES (NEW.id, 'update_profile', 'profile', NEW.id::text, jsonb_build_object('message', 'Updated profile information'));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  AFTER UPDATE OF avatar_url, bio ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.log_profile_updated();

-- Study Circle Joined
CREATE OR REPLACE FUNCTION public.log_room_joined() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.activity_feed (user_id, action_type, target_type, target_id, details)
  VALUES (NEW.user_id, 'join_room', 'room', NEW.room_id, jsonb_build_object('room_id', NEW.room_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_room_joined ON public.room_members;
CREATE TRIGGER on_room_joined
  AFTER INSERT ON public.room_members
  FOR EACH ROW EXECUTE PROCEDURE public.log_room_joined();


-- ─── 4. PROFILE ANALYTICS RPC ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_profile_analytics(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_resources_uploaded INT;
  v_resources_archived INT;
  v_papers_shared INT;
  v_total_downloads INT;
  v_circles_joined INT;
  v_bookmarks INT;
  v_account_age_days INT;
  v_activity_count INT;
BEGIN
  SELECT COUNT(*) INTO v_resources_uploaded FROM public.resources WHERE uploaded_by = p_user_id AND status = 'active';
  SELECT COUNT(*) INTO v_resources_archived FROM public.resources WHERE uploaded_by = p_user_id AND status = 'deleted';
  SELECT COUNT(*) INTO v_papers_shared FROM public.exam_papers WHERE uploaded_by = p_user_id AND status = 'active';
  
  SELECT COALESCE(SUM(download_count), 0) INTO v_total_downloads FROM (
    SELECT download_count FROM public.resources WHERE uploaded_by = p_user_id
    UNION ALL
    SELECT download_count FROM public.exam_papers WHERE uploaded_by = p_user_id
  ) all_downloads;

  SELECT COUNT(*) INTO v_circles_joined FROM public.room_members WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_bookmarks FROM public.stars WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_activity_count FROM public.activity_feed WHERE user_id = p_user_id;
  
  SELECT EXTRACT(DAY FROM (NOW() - created_at))::INT INTO v_account_age_days FROM public.profiles WHERE id = p_user_id;

  RETURN json_build_object(
    'resources_uploaded', COALESCE(v_resources_uploaded, 0),
    'resources_archived', COALESCE(v_resources_archived, 0),
    'papers_shared', COALESCE(v_papers_shared, 0),
    'total_downloads', COALESCE(v_total_downloads, 0),
    'circles_joined', COALESCE(v_circles_joined, 0),
    'bookmarks', COALESCE(v_bookmarks, 0),
    'activity_count', COALESCE(v_activity_count, 0),
    'account_age_days', COALESCE(v_account_age_days, 0)
  );
END;
$$;
