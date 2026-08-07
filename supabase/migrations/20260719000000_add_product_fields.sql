-- Create migration to add missing product fields for metadata, SEO, and speedcubing specifications
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS product_type VARCHAR(100) DEFAULT 'speedcube';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- Rubik's cube specific specifications
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight_g NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_magnetic BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS size_mm NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(50) DEFAULT 'başlanğıc';
