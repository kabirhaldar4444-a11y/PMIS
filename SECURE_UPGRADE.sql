-- ==============================================================================
-- SECURE UPGRADE SCRIPT
-- Safely applies Role, Phone, State, City, and Live Photo updates to Postgres
-- ==============================================================================

-- 1. Upgrade Roles to support Super Admin
-- Drop the old constraint constraining roles to only admin/candidate
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new constraint explicitly allowing super_admin
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('super_admin', 'admin', 'candidate'));

-- 2. Add Candidate Location & Camera Columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS live_photo_url text;

-- 3. Strict Phone Constraint
-- Prevents any user from registering with an already existing phone number
-- Note: If you already have duplicate phone numbers in your test data, this might fail.
-- You would need to clear those duplicates manually first.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_key;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_key UNIQUE (phone);

-- 4. Create the new storage bucket for Live Photos (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('candidate_documents', 'candidate_documents', true) 
ON CONFLICT (id) DO NOTHING;

-- Grant bucket storage policies (Public read, authenticated insert)
DROP POLICY IF EXISTS "Public view live photos" ON storage.objects;
CREATE POLICY "Public view live photos" ON storage.objects FOR SELECT USING (bucket_id = 'candidate_documents');

DROP POLICY IF EXISTS "Authenticated upload live photos" ON storage.objects;
CREATE POLICY "Authenticated upload live photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'candidate_documents');

-- 5. Helper Function update to support security policies
-- Just re-asserting the helper function exists cleanly
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 6. Important Schema Cache Reload
NOTIFY pgrst, 'reload schema';
