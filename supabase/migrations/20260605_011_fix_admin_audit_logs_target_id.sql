-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 011: Fix Admin Audit Logs Target ID Type
-- Date: 2026-06-05
-- Purpose: Ensure target_id is TEXT to support both UUIDs and string IDs, 
--          fixing the "column target_id is of type uuid but expression is of type text" error.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.admin_audit_logs
ALTER COLUMN target_id TYPE text USING target_id::text;
