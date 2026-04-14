-- ==============================================================================
-- RLS FIX FOR STORAGE BUCKETS & PROFILES
-- Fixes the "new row violates row-level security policy" error.
-- ==============================================================================

-- 1. Ensure the aadhaar_cards bucket is completely configured
INSERT INTO storage.buckets (id, name, public) 
VALUES ('aadhaar_cards', 'aadhaar_cards', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop any faulty storage policies on that bucket
DROP POLICY IF EXISTS "Public view aadhaar_cards" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload aadhaar_cards" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update aadhaar_cards" ON storage.objects;

-- 3. Create extremely robust Storage Policies for the bucket
-- Allow public viewing
CREATE POLICY "Public view aadhaar_cards" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'aadhaar_cards');

-- Allow authenticated users to insert (Upload)
CREATE POLICY "Authenticated upload aadhaar_cards" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'aadhaar_cards');

-- Allow authenticated users to update/overwrite their files
CREATE POLICY "Authenticated update aadhaar_cards" 
ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'aadhaar_cards');


-- 4. Ensure Profiles table UPDATE policy is completely explicit
DROP POLICY IF EXISTS "Profile self-update" ON public.profiles;

CREATE POLICY "Profile self-update" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- 5. Reload Schema cache
NOTIFY pgrst, 'reload schema';
