-- ============================================================================================================================
-- PMIS EXAM PORTAL — QUESTION-WISE MARKS SCHEMA UPDATE MIGRATION
-- Paste this ENTIRE file into your Supabase SQL Editor and click "Run".
-- ============================================================================================================================

-- 1. Add marks_per_question to the exams table (Default 5)
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS marks_per_question INTEGER DEFAULT 5;

-- 2. Add question-wise columns and pre-calculated fields to submissions table
ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS marks_per_question INTEGER DEFAULT 5;

ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS question_marks JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS final_score_override INTEGER DEFAULT NULL;

ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS calculated_score INTEGER DEFAULT NULL;

ALTER TABLE public.submissions 
ADD COLUMN IF NOT EXISTS calculated_total INTEGER DEFAULT NULL;

-- 3. Backfill calculations for existing submissions to prevent legacy data from breaking
UPDATE public.submissions
SET 
  marks_per_question = COALESCE(marks_per_question, 5),
  calculated_score = COALESCE(calculated_score, score * 5),
  calculated_total = COALESCE(calculated_total, total_questions * 5)
WHERE calculated_score IS NULL OR calculated_total IS NULL;

-- Reload Schema Cache
NOTIFY pgrst, 'reload schema';
