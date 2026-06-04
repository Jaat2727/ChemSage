-- ═══════════════════════════════════════════════════════════════════════════
-- ChemSAGE Performance Indexes Migration
-- Date: 2026-06-04
-- Purpose: Add B-tree and GIN indexes for server-side search and filtering
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Resources filtering indexes
CREATE INDEX IF NOT EXISTS idx_resources_subject ON public.resources(subject);
CREATE INDEX IF NOT EXISTS idx_resources_course_code ON public.resources(course_code);
CREATE INDEX IF NOT EXISTS idx_resources_semester ON public.resources(semester);

-- 2. Past Papers filtering indexes
-- (exam_papers already has subject, year, semester indexes from previous migrations)
CREATE INDEX IF NOT EXISTS idx_exam_papers_course_code ON public.exam_papers(course_code);

-- 3. GIN Trigram indexes for ILIKE searches on titles/names
-- Enable pg_trgm extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS trgm_idx_resources_title ON public.resources USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS trgm_idx_resources_subject ON public.resources USING GIN (subject gin_trgm_ops);
CREATE INDEX IF NOT EXISTS trgm_idx_resources_course_code ON public.resources USING GIN (course_code gin_trgm_ops);

CREATE INDEX IF NOT EXISTS trgm_idx_exam_papers_course_code ON public.exam_papers USING GIN (course_code gin_trgm_ops);

-- Ensure profiles name is searchable via ilike (for admin panel user search)
CREATE INDEX IF NOT EXISTS trgm_idx_profiles_name ON public.profiles USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS trgm_idx_profiles_roll_no ON public.profiles USING GIN (roll_no gin_trgm_ops);
