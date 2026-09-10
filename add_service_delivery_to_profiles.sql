-- ====================================================================================
-- SERVICE DELIVERY PROGRESS COLUMN (SAFE UPDATE)
-- Adds service_delivery_step (INTEGER default 9) to profiles table
-- ====================================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS service_delivery_step INTEGER DEFAULT 9;

-- Comment for documentation
COMMENT ON COLUMN public.profiles.service_delivery_step IS 'Current 1-9 step index of candidate service delivery milestone';
