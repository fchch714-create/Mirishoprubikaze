-- Adım 13: Supabase Proje Başlatımı ve Uzantıların Kurulumu
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Adım 14: Çok Dilli Ürünler (Products) Tablosunun Oluşturulması
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    price_azn DECIMAL(10, 2) NOT NULL CHECK (price_azn > 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    image_url TEXT NOT NULL,
    
    title_az TEXT NOT NULL,
    title_en TEXT NOT NULL,
    title_ru TEXT NOT NULL,
    description_az TEXT NOT NULL,
    description_en TEXT NOT NULL,
    description_ru TEXT NOT NULL
);

-- Adım 15: Siparişler (Orders) Tablosunun Tasarımı
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_instagram TEXT,
    delivery_address TEXT NOT NULL,
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('Metro', 'Post', 'Courier')),
    total_amount_azn DECIMAL(10, 2) NOT NULL CHECK (total_amount_azn >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    checkout_platform TEXT NOT NULL CHECK (checkout_platform IN ('whatsapp', 'instagram'))
);

-- Adım 16: Sipariş Kalemleri (Order Items) Tablosunun İlişkilendirilmesi
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_azn DECIMAL(10, 2) NOT NULL CHECK (unit_price_azn > 0),
    subtotal_azn DECIMAL(10, 2) NOT NULL CHECK (subtotal_azn > 0)
);
