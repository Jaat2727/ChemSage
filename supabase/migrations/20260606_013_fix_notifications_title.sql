-- ═══════════════════════════════════════════════════════════════════════════
-- Fix Missing Title Column in Notifications
-- ═══════════════════════════════════════════════════════════════════════════

-- The system_hardening migration assumes a title column exists on the notifications table
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title TEXT;
