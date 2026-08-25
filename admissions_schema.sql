-- ====================================================================================
-- ADMISSIONS SCHEMATIC UPGRADE (SAFE UPDATE MODE)
-- Run this script in your Supabase SQL Editor to configure tables, storage policies,
-- and the create_user_from_admission RPC.
-- ====================================================================================

-- 1. Create admissions table
CREATE TABLE IF NOT EXISTS public.admissions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  course_name TEXT,
  pincode TEXT,
  state TEXT,
  city TEXT,
  address TEXT,
  aadhaar_front_url TEXT,
  aadhaar_back_url TEXT,
  pan_url TEXT,
  signature_url TEXT,
  profile_photo_url TEXT,
  video_url TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT admissions_pkey PRIMARY KEY (id)
);

-- 1B. Ensure all columns exist (in case the table already existed without them)
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS aadhaar_front_url TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS aadhaar_back_url TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS pan_url TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS signature_url TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.admissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Allow public insert admissions" ON public.admissions;
DROP POLICY IF EXISTS "Allow admin read admissions" ON public.admissions;
DROP POLICY IF EXISTS "Allow admin update admissions" ON public.admissions;
DROP POLICY IF EXISTS "Allow admin delete admissions" ON public.admissions;

-- 4. Create admissions policies
CREATE POLICY "Allow public insert admissions" 
ON public.admissions FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow admin read admissions" 
ON public.admissions FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Allow admin update admissions" 
ON public.admissions FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Allow admin delete admissions" 
ON public.admissions FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- 5. Add public anonymous upload policies to Storage Objects
DROP POLICY IF EXISTS "Public anonymous upload aadhaar_cards" ON storage.objects;
DROP POLICY IF EXISTS "Public anonymous upload candidate_documents" ON storage.objects;

CREATE POLICY "Public anonymous upload aadhaar_cards" 
ON storage.objects FOR INSERT 
TO anon, authenticated
WITH CHECK (bucket_id = 'aadhaar_cards');

CREATE POLICY "Public anonymous upload candidate_documents" 
ON storage.objects FOR INSERT 
TO anon, authenticated
WITH CHECK (bucket_id = 'candidate_documents');

-- 6. Ensure pan_card_url exists in profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pan_card_url TEXT;

-- 7. Create/Replace RPC function for approving candidate admissions
CREATE OR REPLACE FUNCTION public.create_user_from_admission(
  p_admission_id UUID,
  p_password TEXT,
  p_exam_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_admission RECORD;
  new_user_id UUID;
BEGIN
  -- Fetch details
  SELECT * INTO v_admission FROM public.admissions WHERE id = p_admission_id;
  IF v_admission IS NULL THEN
    RAISE EXCEPTION 'Admission record not found';
  END IF;

  IF v_admission.status = 'approved' THEN
    RAISE EXCEPTION 'Admission has already been approved';
  END IF;

  -- Verify email unique check (optional but helps avoid database failures)
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_admission.email) THEN
    RAISE EXCEPTION 'User account with email % already exists.', v_admission.email;
  END IF;

  -- Verify phone unique check
  IF EXISTS (SELECT 1 FROM public.profiles WHERE phone = v_admission.phone) THEN
    RAISE EXCEPTION 'Candidate with phone number % already exists.', v_admission.phone;
  END IF;

  new_user_id := gen_random_uuid();

  -- Insert Auth User
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
    phone, phone_confirmed_at, confirmation_token, recovery_token, email_change_token_new, email_change
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated', v_admission.email,
    crypt(p_password, gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', v_admission.full_name), FALSE, NOW(), NOW(),
    v_admission.phone, NOW(), '', '', '', ''
  );

  -- Insert Auth Identity
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
  VALUES (
    gen_random_uuid(), new_user_id, format('{"sub":"%s","email":"%s"}', new_user_id::text, v_admission.email)::jsonb,
    'email', new_user_id::text, NOW(), NOW(), NOW()
  );

  -- Insert Public Profile
  INSERT INTO public.profiles (
    id, email, full_name, phone, address, 
    aadhaar_front_url, aadhaar_back_url, profile_photo_url, signature_url, 
    pan_card_url, profile_completed, role, allotted_exam_ids, disclaimer_accepted
  )
  VALUES (
    new_user_id, 
    v_admission.email, 
    v_admission.full_name, 
    v_admission.phone, 
    v_admission.address,
    v_admission.aadhaar_front_url, 
    v_admission.aadhaar_back_url, 
    COALESCE(v_admission.profile_photo_url, v_admission.video_url), 
    v_admission.signature_url,
    v_admission.pan_url, 
    TRUE, -- candidate logged in goes directly to dashboard/exams
    'candidate', 
    CASE WHEN p_exam_id IS NOT NULL THEN ARRAY[p_exam_id]::UUID[] ELSE '{}'::UUID[] END,
    TRUE -- disclaimer accepts automatically
  );

  -- Update admission status
  UPDATE public.admissions 
  SET status = 'approved' 
  WHERE id = p_admission_id;

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.create_user_from_admission(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_from_admission(UUID, TEXT, UUID) TO service_role;

-- 8. Reload schema cache
NOTIFY pgrst, 'reload schema';
