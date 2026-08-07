-- Migration: Add missing columns (is_active, name, price) to public.variants table
-- This aligns the DB schema with the requirements of the Next.js catalog action queries.

-- 1. Add is_active column
ALTER TABLE public.variants ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- 2. Add name column
ALTER TABLE public.variants ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- 3. Add price column
ALTER TABLE public.variants ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0.00 NOT NULL CHECK (price >= 0);
