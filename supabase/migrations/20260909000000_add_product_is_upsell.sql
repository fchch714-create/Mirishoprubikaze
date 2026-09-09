-- Add is_upsell column to products table for in-cart impulse recommendations
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_upsell BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.products.is_upsell IS 'Determines if the product appears in the Cart Upsell Impulse shelf';
