-- Migration to expand Rubikshop Enterprise features
-- Target tables: inventory_movements, services, service_orders, newsletter_subscribers, loyalty_points

-- 1. Inventory Movements
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
    target_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE, -- Used for transfers
    variant_id UUID REFERENCES public.variants(id) ON DELETE CASCADE NOT NULL,
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('in', 'out', 'transfer', 'damaged', 'reserve')),
    quantity INT NOT NULL CHECK (quantity > 0),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS for inventory_movements
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public select for admin/manager or authenticated" ON public.inventory_movements;
DROP POLICY IF EXISTS "Allow admin to manage movements" ON public.inventory_movements;
CREATE POLICY "Admin manage inventory movements" ON public.inventory_movements
    FOR ALL TO authenticated USING (current_user_is_admin_or_manager());

-- 2. Services List
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_az VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    name_ru VARCHAR(255),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS for services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public select for services" ON public.services;
DROP POLICY IF EXISTS "Allow admin to manage services" ON public.services;
CREATE POLICY "Public read services" ON public.services
    FOR SELECT USING (true);
CREATE POLICY "Admin manage services" ON public.services
    FOR ALL TO authenticated USING (current_user_is_admin_or_manager());

-- 3. Service Orders (Customer bookings)
CREATE TABLE IF NOT EXISTS public.service_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS for service_orders
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read for service_orders" ON public.service_orders;
DROP POLICY IF EXISTS "Allow manage for service_orders" ON public.service_orders;
CREATE POLICY "Public create service orders" ON public.service_orders
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage service orders" ON public.service_orders
    FOR SELECT, UPDATE, DELETE TO authenticated USING (current_user_is_admin_or_manager());

-- 4. Newsletter Subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS for newsletter_subscribers
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert for newsletter" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "Allow admin to view/manage newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Public create newsletter subscription" ON public.newsletter_subscribers
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin manage newsletter subscribers" ON public.newsletter_subscribers
    FOR SELECT, UPDATE, DELETE TO authenticated USING (current_user_is_admin_or_manager());

-- 5. Loyalty Points Balance Tracker
CREATE TABLE IF NOT EXISTS public.loyalty_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    balance INT DEFAULT 0 NOT NULL CHECK (balance >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS for loyalty_points
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read for own loyalty_points" ON public.loyalty_points;
DROP POLICY IF EXISTS "Allow manage for admin" ON public.loyalty_points;
CREATE POLICY "Users read own loyalty points" ON public.loyalty_points
    FOR SELECT USING (auth.uid() = user_id OR current_user_is_admin_or_manager());
CREATE POLICY "Admin manage loyalty points" ON public.loyalty_points
    FOR INSERT, UPDATE, DELETE TO authenticated USING (current_user_is_admin_or_manager());

-- INSERT Initial seed data for Services
INSERT INTO public.services (name_az, price, description, is_active) VALUES
('Kub Təmiri (3x3)', 5.00, 'Mexanizmin daxili təmizlənməsi, qırıq hissələrin bərpası və sazlanması.', true),
('Yağlanma & Sazlanma (Lubrication)', 3.00, 'Professional premium yağlarla kubun yağlanması və fırlanma sürətinin tənzimlənməsi.', true),
('Kuryer Bərpa (Premium Restorasiya)', 8.00, 'Professional kuryer tərəfindən kubun götürülməsi, təmiri və tam yenilənmiş şəkildə geri qaytarılması.', true)
ON CONFLICT DO NOTHING;

-- INSERT Initial seed data for Warehouses if not exists
INSERT INTO public.warehouses (name, location, is_active) VALUES
('Mərkəzi Anbar (Bakı)', 'Nərimanov r-nu, Əhməd Rəcəbli 22', true),
('Sumqayıt Filialı', 'Sülh küçəsi 14', true),
('Xarici Tədarükçü (Çin)', 'Shenzhen, CN', true)
ON CONFLICT DO NOTHING;

-- 6. Add CRM columns to public.profiles if not exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS crm_notes TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS customer_type VARCHAR(50) DEFAULT 'B2C';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS crm_segment VARCHAR(50) DEFAULT 'Regular';

