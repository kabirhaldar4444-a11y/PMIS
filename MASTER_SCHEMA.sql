-- ====================================================================================
-- MASTER DATABASE SCHEMA (SAFE UPDATE MODE)
-- This script safely configures tables, RLS policies, and Auth functions without 
-- dropping existing tables or deleting your admin user.
-- ====================================================================================

-- 1. Ensure all tables exist with correct schema (Non-Destructive)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  phone text,
  address text,
  aadhaar_front_url text,
  aadhaar_back_url text,
  profile_photo_url text,
  profile_completed boolean default false,
  role text check (role in ('admin', 'candidate')),
  allotted_exam_ids uuid[] default '{}'::uuid[],
  is_exam_locked boolean default false,
  can_register boolean default true,
  signature_url text,
  disclaimer_accepted boolean default false
);

-- IMPORTANT: Add missing columns if table already exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS disclaimer_accepted BOOLEAN DEFAULT FALSE;

-- Force allotted_exam_ids to be an array type just in case and replace any rogue [null]s
ALTER TABLE public.profiles ALTER COLUMN allotted_exam_ids TYPE UUID[] USING ARRAY[allotted_exam_ids];
UPDATE public.profiles SET allotted_exam_ids = '{}'::UUID[] WHERE allotted_exam_ids = ARRAY[NULL]::UUID[];

CREATE TABLE IF NOT EXISTS public.exams (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  duration integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.questions (
  id uuid default gen_random_uuid() primary key,
  exam_id uuid references public.exams on delete cascade not null,
  question_text text not null,
  options jsonb not null,
  correct_option integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  exam_id uuid references public.exams not null,
  score integer not null,
  total_questions integer not null,
  answers jsonb not null,
  is_released boolean default false,
  admin_score_override integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- 2. Clean and Re-Apply Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Drop old policies to avoid duplicates
DROP POLICY IF EXISTS "Public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profile self-update" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Exams viewable" ON public.exams;
DROP POLICY IF EXISTS "Anyone can view exams" ON public.exams;
DROP POLICY IF EXISTS "Exams admin" ON public.exams;
DROP POLICY IF EXISTS "Admins can manage exams" ON public.exams;
DROP POLICY IF EXISTS "Questions viewable" ON public.questions;
DROP POLICY IF EXISTS "Anyone can view questions" ON public.questions;
DROP POLICY IF EXISTS "Questions admin" ON public.questions;
DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;
DROP POLICY IF EXISTS "Submissions insert" ON public.submissions;
DROP POLICY IF EXISTS "Users can insert their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Submissions view" ON public.submissions;
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Submissions admin" ON public.submissions;
DROP POLICY IF EXISTS "Admins can manage submissions" ON public.submissions;

-- Create clean policies
CREATE POLICY "Public profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profile self-update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Exams viewable" ON public.exams FOR SELECT USING (true);
CREATE POLICY "Exams admin" ON public.exams FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "Questions viewable" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Questions admin" ON public.questions FOR ALL USING (public.get_user_role() = 'admin');

CREATE POLICY "Submissions insert" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Submissions view" ON public.submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Submissions admin" ON public.submissions FOR ALL USING (public.get_user_role() = 'admin');


-- 3. Robust Authentication Function (Fixes Missing Identity Errors)
DROP FUNCTION IF EXISTS public.create_candidate(TEXT, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.create_candidate(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.create_candidate(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_exam_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  new_user_id := gen_random_uuid();

  -- 3A. Insert Auth User
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
    phone, phone_confirmed_at, confirmation_token, recovery_token, email_change_token_new, email_change
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', p_email,
    crypt(p_password, gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', p_full_name), FALSE, NOW(), NOW(),
    NULL, NULL, '', '', '', ''
  );

  -- 3B. Insert Auth Identity (MANDATORY for Supabase GoTrue login)
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(), new_user_id, format('{"sub":"%s","email":"%s"}', new_user_id::text, p_email)::jsonb,
    'email', new_user_id::text, NOW(), NOW(), NOW()
  );

  -- 3C. Insert Public Profile
  INSERT INTO public.profiles (
    id, email, full_name, role, profile_completed, allotted_exam_ids,
    signature_url, disclaimer_accepted
  )
  VALUES (
    new_user_id, p_email, p_full_name, 'candidate', false,
    CASE WHEN p_exam_id IS NOT NULL THEN ARRAY[p_exam_id]::UUID[] ELSE '{}'::UUID[] END,
    NULL, false
  );

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_candidate(TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_candidate(TEXT, TEXT, TEXT, UUID) TO service_role;


-- 4. Automatically retro-fix any existing users constructed dynamically
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT gen_random_uuid(), id, format('{"sub":"%s","email":"%s"}', id::text, email)::jsonb, 'email', id::text, NOW(), created_at, updated_at
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM auth.identities);


-- 5. Finalize by forcing cache reload across Supabase node architecture
NOTIFY pgrst, 'reload schema';
