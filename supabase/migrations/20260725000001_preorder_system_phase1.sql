-- Migration: Pre-Order (Ön Sifariş) System Phase 1
-- Adds allow_preorder and preorder_lead_time to products
-- Creates preorders table with unique code, customer details, status, and supplier summary tracking

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS allow_preorder BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS preorder_lead_time VARCHAR(100) DEFAULT '14-28 iş günü';

-- Create preorders table
CREATE TABLE IF NOT EXISTS public.preorders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preorder_code VARCHAR(50) NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(100) NOT NULL,
  customer_email VARCHAR(255),
  quantity INT NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'pending_payment',
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance & dynamic sorting
CREATE INDEX IF NOT EXISTS idx_preorders_product_id ON public.preorders(product_id);
CREATE INDEX IF NOT EXISTS idx_preorders_status ON public.preorders(status);
CREATE INDEX IF NOT EXISTS idx_preorders_paid_at ON public.preorders(paid_at);
CREATE INDEX IF NOT EXISTS idx_preorders_code ON public.preorders(preorder_code);
CREATE INDEX IF NOT EXISTS idx_products_allow_preorder ON public.products(allow_preorder);
