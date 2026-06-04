-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 009: Drop broken on_auth_user_created trigger
-- Date: 2026-06-05
-- Root Cause: The handle_new_user() trigger on auth.users was inserting into
--   public.profiles with columns (id, name, email, status) — but profiles
--   requires roll_no, programme, and batch_year (all NOT NULL).
--   This caused EVERY signup via admin.createUser() to fail with
--   "Database error creating new user".
-- Fix: Drop the trigger entirely. Profile creation is handled by the
--   Next.js API route /api/auth/signup using the service role key.
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop the trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
