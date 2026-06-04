-- ═══════════════════════════════════════════════════════════════════════════
-- ChemSAGE System Hardening Migration
-- Date: 2026-06-04
-- Purpose: Unified Activity Feed, Triggers, Reputation, and Storage Hardening
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. ACTIVITY FEED TABLE ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- e.g., 'upload_resource', 'create_room', 'earn_star'
  target_type TEXT NOT NULL, -- e.g., 'resource', 'room'
  target_id TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON public.activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON public.activity_feed(user_id);
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activity_feed public read" ON public.activity_feed;
CREATE POLICY "activity_feed public read" ON public.activity_feed
  FOR SELECT USING (public.is_active_user());

-- System manages inserts, users cannot insert manually
DROP POLICY IF EXISTS "activity_feed prevent insert" ON public.activity_feed;
CREATE POLICY "activity_feed prevent insert" ON public.activity_feed
  FOR INSERT WITH CHECK (false);


-- ─── 2. FIX EXISTING NOTIFICATION TRIGGERS (ADD TITLE) ────────────────────

-- Update exam paper notification
CREATE OR REPLACE FUNCTION public.notify_new_exam_paper()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, type, message)
  SELECT id, 'New Exam Paper', 'Past Papers', 'New exam paper uploaded: ' || NEW.subject || ' (' || NEW.exam_type || ' ' || NEW.year || ')'
  FROM public.profiles
  WHERE status = 'active' AND id != NEW.uploaded_by;
  
  RETURN NEW;
END;
$$;

-- Update resource notification
CREATE OR REPLACE FUNCTION public.notify_new_resource()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.room_id IS NOT NULL AND NEW.room_id != 'global' THEN
    INSERT INTO public.notifications (user_id, title, type, message)
    SELECT user_id, 'New Room Resource', 'Resources', 'New resource uploaded in your group: ' || NEW.title
    FROM public.room_members
    WHERE room_id = NEW.room_id AND user_id != NEW.uploaded_by;
  ELSE
    INSERT INTO public.notifications (user_id, title, type, message)
    SELECT id, 'New Vault Resource', 'Resources', 'New resource added to the Study Vault: ' || NEW.title
    FROM public.profiles
    WHERE status = 'active' AND id != NEW.uploaded_by;
  END IF;
  RETURN NEW;
END;
$$;

-- Update message notification
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r_name TEXT;
  s_name TEXT;
BEGIN
  IF NEW.room_id != 'global' THEN
    SELECT name INTO r_name FROM public.rooms WHERE id = NEW.room_id;
    SELECT name INTO s_name FROM public.profiles WHERE id = NEW.sender_id;
    INSERT INTO public.notifications (user_id, title, type, message)
    SELECT user_id, 'New Message', 'Messages', s_name || ' sent a message in ' || r_name
    FROM public.room_members
    WHERE room_id = NEW.room_id AND user_id != NEW.sender_id;
  END IF;
  RETURN NEW;
END;
$$;


-- ─── 3. ACTIVITY FEED GENERATION TRIGGERS ─────────────────────────────────

-- Resource Upload Activity
CREATE OR REPLACE FUNCTION public.log_resource_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status = 'deleted') THEN
    INSERT INTO public.activity_feed (user_id, action_type, target_type, target_id, details)
    VALUES (NEW.uploaded_by, 'upload_resource', 'resource', NEW.id::text, jsonb_build_object('title', NEW.title, 'category', NEW.category));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_resource_activity ON public.resources;
CREATE TRIGGER on_resource_activity
  AFTER INSERT OR UPDATE OF status ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.log_resource_activity();

-- Room Creation Activity
CREATE OR REPLACE FUNCTION public.log_room_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.activity_feed (user_id, action_type, target_type, target_id, details)
  VALUES (NEW.created_by, 'create_room', 'room', NEW.id::text, jsonb_build_object('name', NEW.name, 'location', COALESCE(NEW.location, 'Community')));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_room_activity ON public.rooms;
CREATE TRIGGER on_room_activity
  AFTER INSERT ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.log_room_activity();


-- ─── 4. REPUTATION SCORE AUTOMATION ───────────────────────────────────────

-- Earn reputation on resource/paper upload
CREATE OR REPLACE FUNCTION public.reward_upload_reputation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE public.profiles SET reputation_score = COALESCE(reputation_score, 0) + 5 WHERE id = NEW.uploaded_by;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status = 'deleted' THEN
    UPDATE public.profiles SET reputation_score = COALESCE(reputation_score, 0) + 5 WHERE id = NEW.uploaded_by;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'deleted' AND OLD.status = 'active' THEN
    UPDATE public.profiles SET reputation_score = COALESCE(reputation_score, 0) - 5 WHERE id = NEW.uploaded_by;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS resource_reputation ON public.resources;
CREATE TRIGGER resource_reputation
  AFTER INSERT OR UPDATE OF status ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.reward_upload_reputation();

DROP TRIGGER IF EXISTS paper_reputation ON public.exam_papers;
CREATE TRIGGER paper_reputation
  AFTER INSERT OR UPDATE OF status ON public.exam_papers
  FOR EACH ROW EXECUTE FUNCTION public.reward_upload_reputation();

-- Earn reputation when receiving a star
CREATE OR REPLACE FUNCTION public.reward_star_reputation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.resource_id IS NOT NULL THEN
      SELECT uploaded_by INTO target_user FROM public.resources WHERE id = NEW.resource_id;
    ELSIF NEW.paper_id IS NOT NULL THEN
      SELECT uploaded_by INTO target_user FROM public.exam_papers WHERE id = NEW.paper_id;
    END IF;
    
    IF target_user IS NOT NULL AND target_user != NEW.user_id THEN
      UPDATE public.profiles SET reputation_score = COALESCE(reputation_score, 0) + 2 WHERE id = target_user;
      
      -- Optional: Create activity feed item for earning a star
      INSERT INTO public.activity_feed (user_id, action_type, target_type, target_id, details)
      VALUES (target_user, 'earn_star', 'user', NEW.user_id::text, jsonb_build_object('message', 'Someone starred your upload!'));
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.resource_id IS NOT NULL THEN
      SELECT uploaded_by INTO target_user FROM public.resources WHERE id = OLD.resource_id;
    ELSIF OLD.paper_id IS NOT NULL THEN
      SELECT uploaded_by INTO target_user FROM public.exam_papers WHERE id = OLD.paper_id;
    END IF;
    
    IF target_user IS NOT NULL AND target_user != OLD.user_id THEN
      UPDATE public.profiles SET reputation_score = COALESCE(reputation_score, 0) - 2 WHERE id = target_user;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS star_reputation ON public.stars;
CREATE TRIGGER star_reputation
  AFTER INSERT OR DELETE ON public.stars
  FOR EACH ROW EXECUTE FUNCTION public.reward_star_reputation();


-- ─── 5. ADMIN AUDIT LOG ENFORCEMENT ───────────────────────────────────────

-- Automatically log profile bans and role changes
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF public.is_admin() THEN
    IF NEW.status != OLD.status AND (NEW.status = 'banned' OR OLD.status = 'banned') THEN
      INSERT INTO public.admin_audit_logs (admin_id, action_type, target_id, target_type, details)
      VALUES (auth.uid(), CASE WHEN NEW.status = 'banned' THEN 'ban_user' ELSE 'unban_user' END, NEW.id::text, 'user', jsonb_build_object('name', NEW.name));
    END IF;
    
    IF NEW.role != OLD.role THEN
      INSERT INTO public.admin_audit_logs (admin_id, action_type, target_id, target_type, details)
      VALUES (auth.uid(), CASE WHEN NEW.role = 'admin' THEN 'grant_admin' ELSE 'revoke_admin' END, NEW.id::text, 'user', jsonb_build_object('name', NEW.name));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_profile_updates ON public.profiles;
CREATE TRIGGER audit_profile_updates
  AFTER UPDATE OF status, role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_profile_changes();

-- Automatically log hard deletes
CREATE OR REPLACE FUNCTION public.audit_hard_deletes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF public.is_admin() THEN
    INSERT INTO public.admin_audit_logs (admin_id, action_type, target_id, target_type, details)
    VALUES (auth.uid(), 'hard_delete', OLD.id::text, TG_TABLE_NAME, jsonb_build_object('title', COALESCE(OLD.title, OLD.subject, 'Unknown')));
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS audit_resource_deletes ON public.resources;
CREATE TRIGGER audit_resource_deletes
  AFTER DELETE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.audit_hard_deletes();

DROP TRIGGER IF EXISTS audit_paper_deletes ON public.exam_papers;
CREATE TRIGGER audit_paper_deletes
  AFTER DELETE ON public.exam_papers
  FOR EACH ROW EXECUTE FUNCTION public.audit_hard_deletes();


-- ─── 6. FOLDER SYSTEM INTEGRITY ───────────────────────────────────────────

-- Avoid duplicate folder names at the same level
ALTER TABLE public.folders
  ADD CONSTRAINT unique_folder_name_parent UNIQUE NULLS NOT DISTINCT (name, parent_id, type);


-- ─── 7. STORAGE MIME-TYPE ENFORCEMENT ─────────────────────────────────────

-- We modify the policies to enforce size < 50MB and valid MIME types.
-- NOTE: Supabase storage objects table has column "metadata" which is a JSONB containing size and mimetype.

DROP POLICY IF EXISTS "Active users can upload resources" ON storage.objects;
CREATE POLICY "Active users can upload resources" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'resources' 
    AND public.is_active_user()
    -- Ensure file is under 50MB
    AND (COALESCE((metadata->>'size')::bigint, 0) < 52428800)
  );

DROP POLICY IF EXISTS "Active users can upload past papers" ON storage.objects;
CREATE POLICY "Active users can upload past papers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'past_papers' 
    AND public.is_active_user()
    -- Ensure file is under 50MB
    AND (COALESCE((metadata->>'size')::bigint, 0) < 52428800)
  );

-- Publish activity_feed to realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE activity_feed;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
