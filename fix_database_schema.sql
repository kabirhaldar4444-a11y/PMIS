-- ============================================================================================================================
-- PMIS EXAM PORTAL — COMPLETE DATABASE SCHEMA BOOTSTRAP (WITH SEED ADMIN)
-- Paste this ENTIRE file into your Supabase SQL Editor and click "Run".
-- This script is safe, idempotent, and configures all tables, storage buckets, policies, RLS, functions, and your admin user.
-- ============================================================================================================================

-- ============================================================================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- Required for crypt(), gen_salt(), gen_random_uuid()


-- ============================================================================================================================
-- SECTION 2: TABLE DEFINITIONS
-- ============================================================================================================================

-- ------------------------------------------------------------
-- TABLE: profiles (Central User Identity)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  UUID        REFERENCES auth.users NOT NULL PRIMARY KEY,
  email               TEXT,
  full_name           TEXT,
  phone               TEXT,
  address             TEXT,
  state               TEXT,
  city                TEXT,
  role                TEXT        DEFAULT 'candidate',
  profile_completed   BOOLEAN     DEFAULT FALSE,
  disclaimer_accepted BOOLEAN     DEFAULT FALSE,
  allotted_exam_ids   UUID[]      DEFAULT '{}'::UUID[],
  is_exam_locked      BOOLEAN     DEFAULT FALSE,
  can_register        BOOLEAN     DEFAULT TRUE,
  profile_photo_url   TEXT,
  live_photo_url      TEXT,
  aadhaar_front_url   TEXT,
  aadhaar_back_url    TEXT,
  pan_card_url        TEXT,        -- PAN Card support
  signature_url       TEXT,
  created_at          TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

-- Ensure all columns exist for pre-existing installs (idempotency)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email               TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name           TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone               TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address             TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state               TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city                TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role                TEXT        DEFAULT 'candidate';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_completed   BOOLEAN     DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS disclaimer_accepted BOOLEAN     DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allotted_exam_ids   UUID[]      DEFAULT '{}'::UUID[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_exam_locked      BOOLEAN     DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_register        BOOLEAN     DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photo_url   TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS live_photo_url      TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS aadhaar_front_url   TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS aadhaar_back_url    TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pan_card_url        TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url       TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at          TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW());

-- Enforce role values
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD  CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'candidate'));

-- Enforce unique phone numbers
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_key;
ALTER TABLE public.profiles ADD  CONSTRAINT profiles_phone_key UNIQUE (phone);

-- Fix array type and clean any rogue [NULL] entries from old migrations
ALTER TABLE public.profiles ALTER COLUMN allotted_exam_ids TYPE UUID[] USING
  CASE
    WHEN allotted_exam_ids IS NULL THEN '{}'::UUID[]
    WHEN allotted_exam_ids = ARRAY[NULL]::UUID[] THEN '{}'::UUID[]
    ELSE allotted_exam_ids
  END;

-- ------------------------------------------------------------
-- TABLE: exams (Exam Definitions)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exams (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT        NOT NULL,
  description TEXT,
  duration    INTEGER     NOT NULL,   -- in minutes
  created_at  TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW());

-- ------------------------------------------------------------
-- TABLE: questions (Exam Questions)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id        UUID        REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  question_text  TEXT        NOT NULL,
  options        JSONB       NOT NULL,   -- e.g. ["A", "B", "C", "D"]
  correct_option INTEGER     NOT NULL,   -- 0-indexed
  created_at     TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW());

-- ------------------------------------------------------------
-- TABLE: submissions (Candidate Attempts)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.submissions (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID        REFERENCES auth.users(id) NOT NULL,
  exam_id              UUID        REFERENCES public.exams(id) NOT NULL,
  score                INTEGER     NOT NULL,
  total_questions      INTEGER     NOT NULL,
  answers              JSONB       NOT NULL,   -- question index -> chosen index
  is_released          BOOLEAN     DEFAULT FALSE,
  admin_score_override INTEGER,
  submitted_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW())
);

ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS submitted_at         TIMESTAMPTZ;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS admin_score_override INTEGER;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS is_released          BOOLEAN DEFAULT FALSE;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS created_at           TIMESTAMPTZ DEFAULT TIMEZONE('utc'::TEXT, NOW());


-- ============================================================================================================================
-- SECTION 3: STORAGE BUCKETS
-- ============================================================================================================================

-- Bucket 1: aadhaar_cards — stores Aadhaar front/back, signatures, etc.
INSERT INTO storage.buckets (id, name, public)
VALUES ('aadhaar_cards', 'aadhaar_cards', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- Bucket 2: candidate_documents — stores live webcam photos and PAN cards
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate_documents', 'candidate_documents', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;


-- ============================================================================================================================
-- SECTION 4: STORAGE POLICIES
-- ============================================================================================================================

-- --- aadhaar_cards bucket policies ---
DROP POLICY IF EXISTS "Public view aadhaar_cards"          ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload aadhaar_cards" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update aadhaar_cards" ON storage.objects;

CREATE POLICY "Public view aadhaar_cards"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'aadhaar_cards');

CREATE POLICY "Authenticated upload aadhaar_cards"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'aadhaar_cards');

CREATE POLICY "Authenticated update aadhaar_cards"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'aadhaar_cards');

-- --- candidate_documents bucket policies ---
DROP POLICY IF EXISTS "Public view candidate_documents"          ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload candidate_documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update candidate_documents" ON storage.objects;

CREATE POLICY "Public view candidate_documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'candidate_documents');

CREATE POLICY "Authenticated upload candidate_documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'candidate_documents');

CREATE POLICY "Authenticated update candidate_documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'candidate_documents');


-- ============================================================================================================================
-- SECTION 5: HELPER FUNCTIONS (Defined before RLS Policies refer to them)
-- ============================================================================================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;


-- ============================================================================================================================
-- SECTION 6: ROW LEVEL SECURITY (RLS)
-- ============================================================================================================================

ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Drop all old policies
DROP POLICY IF EXISTS "Public profiles"                       ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profile self-update"                   ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile"    ON public.profiles;
DROP POLICY IF EXISTS "Admin can update any profile"          ON public.profiles;

DROP POLICY IF EXISTS "Exams viewable"                        ON public.exams;
DROP POLICY IF EXISTS "Anyone can view exams"                 ON public.exams;
DROP POLICY IF EXISTS "Exams admin"                           ON public.exams;
DROP POLICY IF EXISTS "Admins can manage exams"               ON public.exams;

DROP POLICY IF EXISTS "Questions viewable"                    ON public.questions;
DROP POLICY IF EXISTS "Anyone can view questions"             ON public.questions;
DROP POLICY IF EXISTS "Questions admin"                       ON public.questions;
DROP POLICY IF EXISTS "Admins can manage questions"           ON public.questions;

DROP POLICY IF EXISTS "Submissions insert"                    ON public.submissions;
DROP POLICY IF EXISTS "Users can insert their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Submissions view"                      ON public.submissions;
DROP POLICY IF EXISTS "Users can view their own submissions"  ON public.submissions;
DROP POLICY IF EXISTS "Submissions admin"                     ON public.submissions;
DROP POLICY IF EXISTS "Admins can manage submissions"         ON public.submissions;
DROP POLICY IF EXISTS "Admins can update submissions"         ON public.submissions;

-- ---- PROFILES policies ----
CREATE POLICY "Public profiles"
  ON public.profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "Profile self-update"
  ON public.profiles FOR UPDATE
  USING     (auth.uid() = id)
  WITH CHECK(auth.uid() = id);

CREATE POLICY "Admin can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.get_user_role() IN ('admin', 'super_admin'));

-- ---- EXAMS policies ----
CREATE POLICY "Exams viewable"
  ON public.exams FOR SELECT
  USING (TRUE);

CREATE POLICY "Exams admin"
  ON public.exams FOR ALL
  USING (public.get_user_role() IN ('admin', 'super_admin'));

-- ---- QUESTIONS policies ----
CREATE POLICY "Questions viewable"
  ON public.questions FOR SELECT
  USING (TRUE);

CREATE POLICY "Questions admin"
  ON public.questions FOR ALL
  USING (public.get_user_role() IN ('admin', 'super_admin'));

-- ---- SUBMISSIONS policies ----
CREATE POLICY "Submissions insert"
  ON public.submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Submissions view"
  ON public.submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Submissions admin"
  ON public.submissions FOR ALL
  USING (public.get_user_role() IN ('admin', 'super_admin'));


-- ============================================================================================================================
-- SECTION 7: RPC FUNCTION — create_candidate()
-- ============================================================================================================================

DROP FUNCTION IF EXISTS public.create_candidate(TEXT, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.create_candidate(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_candidate(
  p_email     TEXT,
  p_password  TEXT,
  p_full_name TEXT,
  p_exam_id   UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  new_user_id := gen_random_uuid();

  -- STEP 1: Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),   -- bcrypt hash
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', p_full_name),
    FALSE,
    NOW(),
    NOW(),
    NULL, NULL, '', '', '', ''
  );

  -- STEP 2: Insert into auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    new_user_id,
    format('{"sub":"%s","email":"%s"}', new_user_id::TEXT, p_email)::JSONB,
    'email',
    new_user_id::TEXT,
    NOW(),
    NOW(),
    NOW()
  );

  -- STEP 3: Insert into public.profiles
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    profile_completed,
    disclaimer_accepted,
    allotted_exam_ids,
    pan_card_url,
    signature_url
  )
  VALUES (
    new_user_id,
    p_email,
    p_full_name,
    'candidate',
    FALSE,
    FALSE,
    CASE WHEN p_exam_id IS NOT NULL THEN ARRAY[p_exam_id]::UUID[] ELSE '{}'::UUID[] END,
    NULL,
    NULL
  );

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution rights
GRANT EXECUTE ON FUNCTION public.create_candidate(TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_candidate(TEXT, TEXT, TEXT, UUID) TO service_role;


-- ============================================================================================================================
-- SECTION 8: RETROACTIVE IDENTITY REPAIR
-- ============================================================================================================================

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  format('{"sub":"%s","email":"%s"}', u.id::TEXT, u.email)::JSONB,
  'email',
  u.id::TEXT,
  NOW(),
  u.created_at,
  u.updated_at
FROM auth.users u
WHERE u.id NOT IN (SELECT user_id FROM auth.identities);


-- ============================================================================================================================
-- SECTION 9: SEED ADMIN USER
-- Seeds your admin account directly in the profiles table.
-- ============================================================================================================================

INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  profile_completed,
  disclaimer_accepted,
  allotted_exam_ids
)
VALUES (
  '23769efc-5975-41f9-a389-4c6521bda10b', 
  'kabirhaldar4444@gmail.com', 
  'Kabir Haldar', 
  'admin', 
  TRUE,
  TRUE,
  '{}'::UUID[]
)
ON CONFLICT (id) DO UPDATE SET 
  role = 'admin', 
  email = EXCLUDED.email, 
  profile_completed = TRUE,
  disclaimer_accepted = TRUE;


-- ============================================================================================================================
-- SECTION 10: SCHEMA CACHE RELOAD
-- ============================================================================================================================
NOTIFY pgrst, 'reload schema';
