-- ====================================================================================
-- SERVICE DELIVERY PROGRESS COLUMN (SAFE UPDATE)
-- Adds service_delivery_step (INTEGER default 12) to profiles table
-- ====================================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS service_delivery_step INTEGER DEFAULT 12;

-- Comment for documentation
COMMENT ON COLUMN public.profiles.service_delivery_step IS 'Current 1-12 step index of candidate service delivery milestone';
