-- Migration: Add missing group_slug, variant_name localization columns, tags and keywords to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS group_slug VARCHAR(255);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variant_name VARCHAR(255);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variant_name_az VARCHAR(255);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variant_name_en VARCHAR(255);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variant_name_ru VARCHAR(255);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';

-- Index for optimized family / sibling query performance
CREATE INDEX IF NOT EXISTS idx_products_group_slug ON public.products(group_slug);
