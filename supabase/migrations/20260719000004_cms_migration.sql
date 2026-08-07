-- Migration to support real Supabase database for CMS elements (Banners, Pages, Navigation Items, FAQs, Blog Posts, and Collections)

-- 1. Alter Banners Table to support sorting
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0 NOT NULL;

-- 2. Alter Pages Table to support SEO meta tags and status
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS meta_title_az VARCHAR(255);
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS meta_title_en VARCHAR(255);
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS meta_title_ru VARCHAR(255);
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS meta_description_az TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS meta_description_en TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS meta_description_ru TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true NOT NULL;

-- 3. Create FAQs Table
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_az TEXT NOT NULL,
    question_en TEXT NOT NULL,
    question_ru TEXT NOT NULL,
    answer_az TEXT NOT NULL,
    answer_en TEXT NOT NULL,
    answer_ru TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Trigger for FAQs update timestamp
CREATE OR REPLACE TRIGGER set_timestamp_faqs
BEFORE UPDATE ON public.faqs
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 4. Create Navigation Items Table
CREATE TABLE IF NOT EXISTS public.navigation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label_az VARCHAR(255) NOT NULL,
    label_en VARCHAR(255) NOT NULL,
    label_ru VARCHAR(255) NOT NULL,
    link_url TEXT NOT NULL,
    location VARCHAR(100) DEFAULT 'header' NOT NULL CHECK (location IN ('header', 'footer_col1', 'footer_col2', 'footer_col3')),
    sort_order INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Trigger for Navigation Items update timestamp
CREATE OR REPLACE TRIGGER set_timestamp_navigation_items
BEFORE UPDATE ON public.navigation_items
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 5. Alter Collections Table to support descriptions (az, en, ru)
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS description_az TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS description_ru TEXT;
