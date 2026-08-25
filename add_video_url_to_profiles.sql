-- SQL to run in Supabase SQL Editor to add video_url column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS video_url TEXT;
