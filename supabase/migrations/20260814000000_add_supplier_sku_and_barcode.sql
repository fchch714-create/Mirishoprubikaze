-- Migration: Add supplier_sku and barcode columns to products and variants tables
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS supplier_sku TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS barcode TEXT;

-- Also add to variants and product_variants tables so each variant can have its own supplier_sku and barcode
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'variants') THEN
    ALTER TABLE public.variants ADD COLUMN IF NOT EXISTS supplier_sku TEXT;
    ALTER TABLE public.variants ADD COLUMN IF NOT EXISTS barcode TEXT;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_variants') THEN
    ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS supplier_sku TEXT;
    ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS barcode TEXT;
  END IF;
END $$;
