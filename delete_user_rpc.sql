-- ============================================================================================================================
-- SQL SCRIPT: DATABASE SETUP FOR SUPER ADMIN & CASCADE DELETION
-- Paste and run this ENTIRE script in your Supabase SQL Editor.
-- ============================================================================================================================

-- 1. Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create the delete_user_by_id RPC function
CREATE OR REPLACE FUNCTION public.delete_user_by_id(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_caller_role TEXT;
  v_caller_email TEXT;
BEGIN
  -- Get caller information from auth.uid()
  SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
  SELECT email INTO v_caller_email FROM auth.users WHERE id = auth.uid();

  -- Check permissions
  -- Caller must be admin or super_admin
  IF v_caller_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Access Denied: Only administrators can delete accounts.';
  END IF;

  -- Prevent deleting the super admin email admin@pmi.com or kabirhaldar4444@gmail.com
  IF (SELECT email FROM auth.users WHERE id = p_user_id) IN ('admin@pmi.com', 'kabirhaldar4444@gmail.com') THEN
    RAISE EXCEPTION 'Access Denied: Super Admin accounts cannot be deleted.';
  END IF;

  -- Delete submissions for the user
  DELETE FROM public.submissions WHERE user_id = p_user_id;

  -- Delete profile for the user
  DELETE FROM public.profiles WHERE id = p_user_id;

  -- Delete identities for the user
  DELETE FROM auth.identities WHERE user_id = p_user_id;

  -- Delete the user from auth.users
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution rights to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user_by_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_by_id(UUID) TO service_role;


-- 3. Seed/Update Super Admin account kabirhaldar4444@gmail.com with password '123456'
DO $$
DECLARE
  v_user_id UUID := '23769efc-5975-41f9-a389-4c6521bda10b'; -- Seeded UUID for Kabir Haldar
  v_email TEXT := 'kabirhaldar4444@gmail.com';
  v_password TEXT := '123456';
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE email = v_email) INTO v_exists;
  
  IF v_exists THEN
    -- Update existing user password and force immediate confirmation
    UPDATE auth.users 
    SET encrypted_password = crypt(v_password, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE email = v_email
    RETURNING id INTO v_user_id;
  ELSE
    -- Insert new user in auth.users
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
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Kabir Haldar"}'::jsonb,
      FALSE, NOW(), NOW(),
      NULL, NULL, '', '', '', ''
    );
  END IF;

  -- Ensure identity exists in auth.identities
  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_user_id) THEN
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
      v_user_id,
      format('{"sub":"%s","email":"%s"}', v_user_id::TEXT, v_email)::JSONB,
      'email',
      v_user_id::TEXT,
      NOW(),
      NOW(),
      NOW()
    );
  ELSE
    UPDATE auth.identities
    SET identity_data = format('{"sub":"%s","email":"%s"}', v_user_id::TEXT, v_email)::JSONB,
        updated_at = NOW()
    WHERE user_id = v_user_id;
  END IF;

  -- Upsert profile in public.profiles with role = 'super_admin'
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
    v_user_id,
    v_email,
    'Kabir Haldar',
    'super_admin',
    TRUE,
    TRUE,
    '{}'::UUID[]
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    email = EXCLUDED.email,
    profile_completed = TRUE,
    disclaimer_accepted = TRUE;

END;
$$;


-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
