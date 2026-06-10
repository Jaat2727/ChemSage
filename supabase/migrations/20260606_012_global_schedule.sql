-- ═══════════════════════════════════════════════════════════════════════════
-- ChemSAGE Global Schedule Update
-- Date: 2026-06-06
-- Purpose: Convert personal timetable into a global, collaborative schedule
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop existing policies on the schedule table
DO $$ DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'schedule' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.schedule', pol.policyname);
    END LOOP;
END $$;

-- ─── GLOBAL SCHEDULE POLICIES ──────────────────────────────────────────

-- SELECT: Any active user can view the global schedule
CREATE POLICY "schedule active read" ON public.schedule
  FOR SELECT USING (public.is_active_user());

-- INSERT: Any active user can add to the global schedule
-- (user_id will record who added it)
CREATE POLICY "schedule active insert" ON public.schedule
  FOR INSERT WITH CHECK (public.is_active_user() AND user_id = auth.uid());

-- UPDATE: Any active user can edit any entry
CREATE POLICY "schedule active update" ON public.schedule
  FOR UPDATE USING (public.is_active_user())
  WITH CHECK (public.is_active_user());

-- DELETE: Any active user can delete any entry
CREATE POLICY "schedule active delete" ON public.schedule
  FOR DELETE USING (public.is_active_user());
