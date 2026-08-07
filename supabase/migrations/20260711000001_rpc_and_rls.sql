-- Adım 17: İşlemsel Bütünlük İçin RPC (Remote Procedure Call) Tetikleyicisi
CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_customer_instagram TEXT,
    p_delivery_address TEXT,
    p_delivery_method TEXT,
    p_total_amount DECIMAL,
    p_checkout_platform TEXT,
    p_items JSONB
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
BEGIN
    INSERT INTO public.orders (
        customer_name, customer_phone, customer_instagram, 
        delivery_address, delivery_method, total_amount_azn, checkout_platform
    ) VALUES (
        p_customer_name, p_customer_phone, p_customer_instagram, 
        p_delivery_address, p_delivery_method, p_total_amount, p_checkout_platform
    ) RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            order_id, product_id, quantity, unit_price_azn, subtotal_azn
        ) VALUES (
            v_order_id, 
            (v_item->>'product_id')::UUID, 
            (v_item->>'quantity')::INTEGER, 
            (v_item->>'unit_price_azn')::DECIMAL, 
            (v_item->>'subtotal_azn')::DECIMAL
        );
    END LOOP;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adım 18: Satır Düzeyi Güvenlik (Row Level Security - RLS) Politikalarının Uygulanması
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Adım 19: RLS Politikalarında JWT Token ve Rol Doğrulaması
CREATE POLICY "Public can view active products" 
    ON public.products FOR SELECT TO public, anon, authenticated 
    USING (is_active = true);

CREATE POLICY "Admin full access products" 
    ON public.products FOR ALL TO authenticated 
    USING ((auth.jwt() ->> 'email') = 'admin@rubikshop.az')
    WITH CHECK ((auth.jwt() ->> 'email') = 'admin@rubikshop.az');

CREATE POLICY "Admin can view all orders" 
    ON public.orders FOR SELECT TO authenticated 
    USING ((auth.jwt() ->> 'email') = 'admin@rubikshop.az');

CREATE POLICY "Admin can update orders" 
    ON public.orders FOR UPDATE TO authenticated 
    USING ((auth.jwt() ->> 'email') = 'admin@rubikshop.az');

CREATE POLICY "Admin can view all order items" 
    ON public.order_items FOR SELECT TO authenticated 
    USING ((auth.jwt() ->> 'email') = 'admin@rubikshop.az');

-- Adım 20: Veritabanı Performans İndekslerinin Tanımlanması
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
