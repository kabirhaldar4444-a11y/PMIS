-- 1. Fix the column type in the profiles table to be an array of UUIDs
ALTER TABLE public.profiles 
  ALTER COLUMN allotted_exam_ids TYPE UUID[] 
  USING ARRAY[allotted_exam_ids];

-- 2. Drop the old function just in case the signature changed
DROP FUNCTION IF EXISTS public.create_candidate(TEXT, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.create_candidate(TEXT, TEXT, TEXT);

-- 3. Re-create the RPC function
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
  -- 1. Create the user in Supabase Auth
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
    updated_at
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    NOW(), 
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', p_full_name),
    FALSE, NOW(), NOW()
  )
  RETURNING id INTO new_user_id;

  -- 2. Create the profile in public.profiles
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    profile_completed,
    allotted_exam_ids
  )
  VALUES (
    new_user_id, 
    p_email, 
    p_full_name, 
    'candidate', 
    false,
    CASE WHEN p_exam_id IS NOT NULL THEN ARRAY[p_exam_id] ELSE ARRAY[]::UUID[] END
  );

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant access
GRANT EXECUTE ON FUNCTION public.create_candidate(TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_candidate(TEXT, TEXT, TEXT, UUID) TO service_role;
