-- 1. Reload the PostgREST schema cache to fix the "Database error querying schema" error
NOTIFY pgrst, 'reload schema';

-- 2. Clean up any [null] arrays that were created during the type conversion
UPDATE public.profiles 
SET allotted_exam_ids = '{}'::UUID[] 
WHERE allotted_exam_ids = ARRAY[NULL]::UUID[];
