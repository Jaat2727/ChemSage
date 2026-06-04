-- ═══════════════════════════════════════════════════════════════════════════
-- ChemSAGE Complete Schema Fix Migration
-- Date: 2026-06-04
-- Purpose: Add ALL missing columns, tables, indexes, constraints, and FKs
--          that are referenced in the frontend code but never created.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. ADD MISSING COLUMNS TO EXISTING TABLES ──────────────────────────

-- 1a. profiles: avatar, banner, bio, interests, subjects, last_active, reputation
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS banner_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS academic_interests TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS preferred_subjects TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reputation_score INT DEFAULT 0;

-- 1b. resources: file_size, download_count, version, status, folder_id, subject, etc.
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS download_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS version TEXT DEFAULT 'v1.0',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
  ADD COLUMN IF NOT EXISTS folder_id UUID,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS course_code TEXT,
  ADD COLUMN IF NOT EXISTS semester TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 1c. exam_papers: file_size, download_count, course_code, faculty, version, status, etc.
ALTER TABLE public.exam_papers
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS download_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS course_code TEXT,
  ADD COLUMN IF NOT EXISTS faculty TEXT,
  ADD COLUMN IF NOT EXISTS version TEXT DEFAULT 'v1.0',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted')),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS folder_id UUID;

-- 1d. rooms: location, contact_info, invited_people
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS contact_info TEXT,
  ADD COLUMN IF NOT EXISTS invited_people TEXT;

-- 1e. room_members: last_read_at, is_favorite
ALTER TABLE public.room_members
  ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- 1f. messages: is_pinned
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;


-- ─── 2. CREATE MISSING TABLES ───────────────────────────────────────────

-- 2a. folders — for vault and archive folder organization
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'past_papers'))
);

-- 2b. stars — bookmarks/favorites for resources, papers, rooms
CREATE TABLE IF NOT EXISTS public.stars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  paper_id UUID REFERENCES public.exam_papers(id) ON DELETE CASCADE,
  room_id TEXT REFERENCES public.rooms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Ensure user can only star an item once
  CONSTRAINT stars_unique_resource UNIQUE (user_id, resource_id),
  CONSTRAINT stars_unique_paper UNIQUE (user_id, paper_id),
  CONSTRAINT stars_unique_room UNIQUE (user_id, room_id),
  -- Ensure at least one target is set
  CONSTRAINT stars_has_target CHECK (
    resource_id IS NOT NULL OR paper_id IS NOT NULL OR room_id IS NOT NULL
  )
);

-- 2c. comments — for resources and papers
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  paper_id UUID REFERENCES public.exam_papers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT comments_has_target CHECK (
    resource_id IS NOT NULL OR paper_id IS NOT NULL
  )
);

-- 2d. resource_versions — version history for file replacements
CREATE TABLE IF NOT EXISTS public.resource_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  paper_id UUID REFERENCES public.exam_papers(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  changed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  change_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2e. admin_audit_logs — audit trail for admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_id TEXT,
  target_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2f. tasks — personal task board (replacing localStorage)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ─── 3. ADD FOREIGN KEY FOR FOLDER REFERENCES ──────────────────────────

-- resources.folder_id → folders.id (set null on folder delete)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'resources_folder_id_fkey'
  ) THEN
    ALTER TABLE public.resources
      ADD CONSTRAINT resources_folder_id_fkey
      FOREIGN KEY (folder_id) REFERENCES public.folders(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- exam_papers.folder_id → folders.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'exam_papers_folder_id_fkey'
  ) THEN
    ALTER TABLE public.exam_papers
      ADD CONSTRAINT exam_papers_folder_id_fkey
      FOREIGN KEY (folder_id) REFERENCES public.folders(id)
      ON DELETE SET NULL;
  END IF;
END $$;


-- ─── 4. ADD INDEXES FOR PERFORMANCE ─────────────────────────────────────

-- Resources indexes
CREATE INDEX IF NOT EXISTS idx_resources_uploaded_by ON public.resources(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_resources_folder_id ON public.resources(folder_id);
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_status ON public.resources(status);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON public.resources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_download_count ON public.resources(download_count DESC);

-- Exam papers indexes
CREATE INDEX IF NOT EXISTS idx_exam_papers_subject ON public.exam_papers(subject);
CREATE INDEX IF NOT EXISTS idx_exam_papers_year_sem ON public.exam_papers(year, semester);
CREATE INDEX IF NOT EXISTS idx_exam_papers_uploaded_by ON public.exam_papers(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_exam_papers_status ON public.exam_papers(status);
CREATE INDEX IF NOT EXISTS idx_exam_papers_created_at ON public.exam_papers(created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_room_created ON public.messages(room_id, created_at DESC);

-- Room members indexes
CREATE INDEX IF NOT EXISTS idx_room_members_user ON public.room_members(user_id);

-- Schedule indexes
CREATE INDEX IF NOT EXISTS idx_schedule_user_day ON public.schedule(user_id, day_of_week);

-- Stars indexes
CREATE INDEX IF NOT EXISTS idx_stars_user ON public.stars(user_id);
CREATE INDEX IF NOT EXISTS idx_stars_resource ON public.stars(resource_id) WHERE resource_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stars_paper ON public.stars(paper_id) WHERE paper_id IS NOT NULL;

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_resource ON public.comments(resource_id) WHERE resource_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_paper ON public.comments(paper_id) WHERE paper_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- Folders indexes
CREATE INDEX IF NOT EXISTS idx_folders_parent ON public.folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_created_by ON public.folders(created_by);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON public.tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date) WHERE due_date IS NOT NULL;

-- Admin audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.admin_audit_logs(target_type, target_id);


-- ─── 5. ENABLE RLS ON NEW TABLES ────────────────────────────────────────

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;


-- ─── 6. FIX RESOURCE & EXAM PAPER RLS — ALLOW STUDENT WRITES ───────────

-- Drop the overly restrictive admin-only write policies
DROP POLICY IF EXISTS "resources admin write" ON public.resources;
DROP POLICY IF EXISTS "exam_papers admin write" ON public.exam_papers;

-- Resources: Active users can insert their own
DROP POLICY IF EXISTS "resources active insert" ON public.resources;
DROP POLICY IF EXISTS "resources active insert" ON public.resources;
CREATE POLICY "resources active insert" ON public.resources
  FOR INSERT WITH CHECK (
    public.is_active_user() AND uploaded_by = auth.uid()
  );

-- Resources: Owners or admins can update
DROP POLICY IF EXISTS "resources owner or admin update" ON public.resources;
DROP POLICY IF EXISTS "resources owner or admin update" ON public.resources;
CREATE POLICY "resources owner or admin update" ON public.resources
  FOR UPDATE USING (
    uploaded_by = auth.uid() OR public.is_admin()
  ) WITH CHECK (
    uploaded_by = auth.uid() OR public.is_admin()
  );

-- Resources: Owners or admins can delete
DROP POLICY IF EXISTS "resources owner or admin delete" ON public.resources;
DROP POLICY IF EXISTS "resources owner or admin delete" ON public.resources;
CREATE POLICY "resources owner or admin delete" ON public.resources
  FOR DELETE USING (
    uploaded_by = auth.uid() OR public.is_admin()
  );

-- Exam Papers: Active users can insert their own
DROP POLICY IF EXISTS "exam_papers active insert" ON public.exam_papers;
DROP POLICY IF EXISTS "exam_papers active insert" ON public.exam_papers;
CREATE POLICY "exam_papers active insert" ON public.exam_papers
  FOR INSERT WITH CHECK (
    public.is_active_user() AND uploaded_by = auth.uid()
  );

-- Exam Papers: Owners or admins can update
DROP POLICY IF EXISTS "exam_papers owner or admin update" ON public.exam_papers;
DROP POLICY IF EXISTS "exam_papers owner or admin update" ON public.exam_papers;
CREATE POLICY "exam_papers owner or admin update" ON public.exam_papers
  FOR UPDATE USING (
    uploaded_by = auth.uid() OR public.is_admin()
  ) WITH CHECK (
    uploaded_by = auth.uid() OR public.is_admin()
  );

-- Exam Papers: Owners or admins can delete
DROP POLICY IF EXISTS "exam_papers owner or admin delete" ON public.exam_papers;
DROP POLICY IF EXISTS "exam_papers owner or admin delete" ON public.exam_papers;
CREATE POLICY "exam_papers owner or admin delete" ON public.exam_papers
  FOR DELETE USING (
    uploaded_by = auth.uid() OR public.is_admin()
  );


-- ─── 7. RLS POLICIES FOR NEW TABLES ────────────────────────────────────

-- Folders: Active users can read, active users can create, owners/admins can modify
DROP POLICY IF EXISTS "folders active read" ON public.folders;
DROP POLICY IF EXISTS "folders active read" ON public.folders;
CREATE POLICY "folders active read" ON public.folders
  FOR SELECT USING (public.is_active_user());

DROP POLICY IF EXISTS "folders active insert" ON public.folders;
DROP POLICY IF EXISTS "folders active insert" ON public.folders;
CREATE POLICY "folders active insert" ON public.folders
  FOR INSERT WITH CHECK (public.is_active_user() AND created_by = auth.uid());

DROP POLICY IF EXISTS "folders owner or admin update" ON public.folders;
DROP POLICY IF EXISTS "folders owner or admin update" ON public.folders;
CREATE POLICY "folders owner or admin update" ON public.folders
  FOR UPDATE USING (created_by = auth.uid() OR public.is_admin())
  WITH CHECK (created_by = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "folders owner or admin delete" ON public.folders;
DROP POLICY IF EXISTS "folders owner or admin delete" ON public.folders;
CREATE POLICY "folders owner or admin delete" ON public.folders
  FOR DELETE USING (created_by = auth.uid() OR public.is_admin());

-- Stars: Users manage their own stars
DROP POLICY IF EXISTS "stars own read" ON public.stars;
DROP POLICY IF EXISTS "stars own read" ON public.stars;
CREATE POLICY "stars own read" ON public.stars
  FOR SELECT USING (user_id = auth.uid() OR public.is_active_user());

DROP POLICY IF EXISTS "stars own insert" ON public.stars;
DROP POLICY IF EXISTS "stars own insert" ON public.stars;
CREATE POLICY "stars own insert" ON public.stars
  FOR INSERT WITH CHECK (user_id = auth.uid() AND public.is_active_user());

DROP POLICY IF EXISTS "stars own delete" ON public.stars;
DROP POLICY IF EXISTS "stars own delete" ON public.stars;
CREATE POLICY "stars own delete" ON public.stars
  FOR DELETE USING (user_id = auth.uid());

-- Comments: Active users can read and create, owners/admins can delete
DROP POLICY IF EXISTS "comments active read" ON public.comments;
DROP POLICY IF EXISTS "comments active read" ON public.comments;
CREATE POLICY "comments active read" ON public.comments
  FOR SELECT USING (public.is_active_user());

DROP POLICY IF EXISTS "comments active insert" ON public.comments;
DROP POLICY IF EXISTS "comments active insert" ON public.comments;
CREATE POLICY "comments active insert" ON public.comments
  FOR INSERT WITH CHECK (public.is_active_user() AND user_id = auth.uid());

DROP POLICY IF EXISTS "comments own or admin delete" ON public.comments;
DROP POLICY IF EXISTS "comments own or admin delete" ON public.comments;
CREATE POLICY "comments own or admin delete" ON public.comments
  FOR DELETE USING (user_id = auth.uid() OR public.is_admin());

-- Resource versions: Active users can read, owners/admins can insert
DROP POLICY IF EXISTS "resource_versions active read" ON public.resource_versions;
DROP POLICY IF EXISTS "resource_versions active read" ON public.resource_versions;
CREATE POLICY "resource_versions active read" ON public.resource_versions
  FOR SELECT USING (public.is_active_user());

DROP POLICY IF EXISTS "resource_versions active insert" ON public.resource_versions;
DROP POLICY IF EXISTS "resource_versions active insert" ON public.resource_versions;
CREATE POLICY "resource_versions active insert" ON public.resource_versions
  FOR INSERT WITH CHECK (public.is_active_user() AND changed_by = auth.uid());

-- Admin audit logs: Only admins can read and write
DROP POLICY IF EXISTS "audit_logs admin read" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "audit_logs admin read" ON public.admin_audit_logs;
CREATE POLICY "audit_logs admin read" ON public.admin_audit_logs
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "audit_logs admin insert" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "audit_logs admin insert" ON public.admin_audit_logs;
CREATE POLICY "audit_logs admin insert" ON public.admin_audit_logs
  FOR INSERT WITH CHECK (public.is_admin());

-- Tasks: Users manage their own tasks
DROP POLICY IF EXISTS "tasks own crud" ON public.tasks;
DROP POLICY IF EXISTS "tasks own crud" ON public.tasks;
CREATE POLICY "tasks own crud" ON public.tasks
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ─── 8. FIX NOTIFICATIONS ──────────────────────────────────────────────

-- Add user delete policy for notifications (missing — users can't clear notifications)
DROP POLICY IF EXISTS "notifications user delete" ON public.notifications;
DROP POLICY IF EXISTS "notifications user delete" ON public.notifications;
CREATE POLICY "notifications user delete" ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Fix the CHECK constraint on notification type to match UI categories
-- We need to drop and recreate since ALTER CONSTRAINT isn't supported
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (
    type IN ('auth', 'synergy_group', 'vault', 'Resources', 'Past Papers', 'Study Circles', 'Tasks', 'Messages', 'Admin', 'System')
  );

-- Add link column if missing
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS link TEXT;


-- ─── 9. PRIVILEGE ESCALATION PREVENTION ─────────────────────────────────

-- Prevent non-admins from modifying their own role or status
CREATE OR REPLACE FUNCTION public.prevent_role_status_self_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the user is not an admin and is modifying their own profile
  IF NOT public.is_admin() AND NEW.id = auth.uid() THEN
    -- Prevent changing role
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'You cannot modify your own role';
    END IF;
    -- Prevent changing status
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'You cannot modify your own status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_role_status_change ON public.profiles;
CREATE TRIGGER prevent_role_status_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_status_self_change();


-- ─── 10. SERVER-SIDE DOWNLOAD COUNT INCREMENT ───────────────────────────

-- Atomic increment to prevent race conditions
CREATE OR REPLACE FUNCTION public.increment_download_count(
  p_table TEXT,
  p_id UUID
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INT;
BEGIN
  IF p_table = 'resources' THEN
    UPDATE public.resources
    SET download_count = COALESCE(download_count, 0) + 1
    WHERE id = p_id
    RETURNING download_count INTO new_count;
  ELSIF p_table = 'exam_papers' THEN
    UPDATE public.exam_papers
    SET download_count = COALESCE(download_count, 0) + 1
    WHERE id = p_id
    RETURNING download_count INTO new_count;
  ELSE
    RAISE EXCEPTION 'Invalid table: %', p_table;
  END IF;
  
  RETURN COALESCE(new_count, 0);
END;
$$;


-- ─── 11. NOTIFICATION TRIGGER FOR EXAM PAPER UPLOADS ────────────────────

CREATE OR REPLACE FUNCTION public.notify_new_exam_paper()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Notify all active users about the new paper
  INSERT INTO public.notifications (user_id, type, message)
  SELECT id, 'Past Papers', 'New exam paper uploaded: ' || NEW.subject || ' (' || NEW.exam_type || ' ' || NEW.year || ')'
  FROM public.profiles
  WHERE status = 'active' AND id != NEW.uploaded_by;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_exam_paper ON public.exam_papers;
CREATE TRIGGER on_new_exam_paper
  AFTER INSERT ON public.exam_papers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_exam_paper();


-- ─── 12. UPDATE EXISTING RESOURCE NOTIFICATION TYPE ─────────────────────

-- Update the existing resource notification trigger to use the new type
CREATE OR REPLACE FUNCTION public.notify_new_resource()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.room_id IS NOT NULL AND NEW.room_id != 'global' THEN
    INSERT INTO public.notifications (user_id, type, message)
    SELECT user_id, 'Resources', 'New resource uploaded in your group: ' || NEW.title
    FROM public.room_members
    WHERE room_id = NEW.room_id AND user_id != NEW.uploaded_by;
  ELSE
    INSERT INTO public.notifications (user_id, type, message)
    SELECT id, 'Resources', 'New resource added to the Study Vault: ' || NEW.title
    FROM public.profiles
    WHERE status = 'active' AND id != NEW.uploaded_by;
  END IF;
  RETURN NEW;
END;
$$;

-- Update message notification to use new type
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
    INSERT INTO public.notifications (user_id, type, message)
    SELECT user_id, 'Messages', s_name || ' sent a message in ' || r_name
    FROM public.room_members
    WHERE room_id = NEW.room_id AND user_id != NEW.sender_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Update profile approval notification to use new type
CREATE OR REPLACE FUNCTION public.notify_profile_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, type, message)
    VALUES (NEW.id, 'Admin', 'Your account has been approved by an administrator. Welcome to ChemSAGE!');
  END IF;
  RETURN NEW;
END;
$$;


-- ─── 13. ENABLE REALTIME FOR NEW TABLES ─────────────────────────────────

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE stars;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE comments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
