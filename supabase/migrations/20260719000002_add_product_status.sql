-- Migration: Add status column to public.products table
-- Aligns with the admin panel's 3-state product status selection (Aktiv, Qaralama, Arxiv).

-- 1. Add status column with CHECK constraint
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft' NOT NULL CHECK (status IN ('publish', 'draft', 'archive'));

-- 2. Backfill status column from existing is_active boolean
UPDATE public.products SET status = 'publish' WHERE is_active = true AND status = 'draft';
UPDATE public.products SET status = 'draft' WHERE is_active = false AND status = 'draft';
