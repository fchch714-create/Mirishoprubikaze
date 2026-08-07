-- Migration: Add video_url column to public.products table
-- Aligns with the YouTube Video link input in the Media tab of the admin product manager.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url TEXT;
