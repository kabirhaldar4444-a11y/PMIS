-- 1. Drop existing functions
DROP FUNCTION IF EXISTS public.create_candidate(TEXT, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.create_candidate(TEXT, TEXT, TEXT);

-- 2. Create the robust RPC function with auth.identities
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
  -- 1. Generate new UUID
  new_user_id := gen_random_uuid();

  -- 2. Create the user in Supabase Auth
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
    crypt(p_password, gen_salt('bf')),
    NOW(), 
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', p_full_name),
    FALSE, NOW(), NOW(),
    NULL, NULL, '', '', '', ''
  );

  -- 3. Create the identity in auth.identities (MANDATORY for Supabase GoTrue login)
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
    format('{"sub":"%s","email":"%s"}', new_user_id::text, p_email)::jsonb,
    'email',
    new_user_id::text, -- email provider uses user UUID as provider_id
    NOW(),
    NOW(),
    NOW()
  );

  -- 4. Create the profile in public.profiles
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

-- 5. Grant Access
GRANT EXECUTE ON FUNCTION public.create_candidate(TEXT, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_candidate(TEXT, TEXT, TEXT, UUID) TO service_role;

-- 6. Fix ALREADY CREATED users that don't have identities
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT 
  gen_random_uuid(), 
  id, 
  format('{"sub":"%s","email":"%s"}', id::text, email)::jsonb, 
  'email', 
  id::text, 
  NOW(), 
  created_at, 
  updated_at
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM auth.identities);

-- 7. Reload schema cache once more safely
NOTIFY pgrst, 'reload schema';
