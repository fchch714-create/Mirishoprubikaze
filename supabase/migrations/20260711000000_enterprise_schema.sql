-- =========================================================================
-- ENTERPRISE SCHEMATIC BLUEPRINT FOR RUBIKSHOP.AZ (BƏND 24)
-- =========================================================================

-- Clean slate drop commands in reverse dependency order to avoid constraints conflicts
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS referral_records CASCADE;
DROP TABLE IF EXISTS loyalty_points_history CASCADE;
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS integrations CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS compare_lists CASCADE;
DROP TABLE IF EXISTS wishlists CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS refunds CASCADE;
DROP TABLE IF EXISTS return_items CASCADE;
DROP TABLE IF EXISTS returns CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS gift_cards CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS collection_products CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS variant_attribute_values CASCADE;
DROP TABLE IF EXISTS variants CASCADE;
DROP TABLE IF EXISTS attribute_values CASCADE;
DROP TABLE IF EXISTS attributes CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS brands CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS customer_groups CASCADE;

-- Base Timestamp Function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================
-- SECTION 1: USERS, ROLES, PERMISSIONS, CUSTOMER GROUPS
-- =========================================================================

-- 1.1 Customer Groups
CREATE TABLE customer_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00 NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_customer_groups
BEFORE UPDATE ON customer_groups
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 1.2 Profiles (Linked to auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    phone VARCHAR(100),
    avatar_url TEXT,
    customer_group_id UUID REFERENCES customer_groups(id) ON DELETE SET NULL,
    role VARCHAR(50) DEFAULT 'customer' NOT NULL CHECK (role IN ('customer', 'admin', 'manager', 'editor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_profiles
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 1.3 Roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_roles
BEFORE UPDATE ON roles
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 1.4 Permissions
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_permissions
BEFORE UPDATE ON permissions
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 1.5 Role-Permissions Map
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- =========================================================================
-- SECTION 2: CATALOG (PRODUCTS, VARIANTS, ATTRIBUTES, CATEGORIES, BRANDS)
-- =========================================================================

-- 2.1 Brands
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_brands
BEFORE UPDATE ON brands
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 2.2 Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_az VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ru VARCHAR(255) NOT NULL,
    slug_az VARCHAR(255) NOT NULL UNIQUE,
    slug_en VARCHAR(255) NOT NULL UNIQUE,
    slug_ru VARCHAR(255) NOT NULL UNIQUE,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_categories
BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 2.3 Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_az VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    title_ru VARCHAR(255) NOT NULL,
    description_az TEXT,
    description_en TEXT,
    description_ru TEXT,
    slug VARCHAR(255) NOT NULL UNIQUE,
    price_azn DECIMAL(10,2) NOT NULL CHECK (price_azn >= 0),
    compare_at_price_azn DECIMAL(10,2) CHECK (compare_at_price_azn >= 0),
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_products
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 2.4 Product Categories Map
CREATE TABLE product_categories (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

-- 2.5 Attributes (e.g. Color, Type, Size)
CREATE TABLE attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_az VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ru VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_attributes
BEFORE UPDATE ON attributes
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 2.6 Attribute Values (e.g. Red, Stickerless, 3x3)
CREATE TABLE attribute_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attribute_id UUID REFERENCES attributes(id) ON DELETE CASCADE,
    value_az VARCHAR(255) NOT NULL,
    value_en VARCHAR(255) NOT NULL,
    value_ru VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_attribute_values
BEFORE UPDATE ON attribute_values
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 2.7 Variants
CREATE TABLE variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    price_azn DECIMAL(10,2) NOT NULL CHECK (price_azn >= 0),
    compare_at_price_azn DECIMAL(10,2) CHECK (compare_at_price_azn >= 0),
    stock INT DEFAULT 0 NOT NULL CHECK (stock >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_variants
BEFORE UPDATE ON variants
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 2.8 Variant Attribute Values Map
CREATE TABLE variant_attribute_values (
    variant_id UUID REFERENCES variants(id) ON DELETE CASCADE,
    attribute_value_id UUID REFERENCES attribute_values(id) ON DELETE CASCADE,
    PRIMARY KEY (variant_id, attribute_value_id)
);

-- 2.9 Collections
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_az VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ru VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_collections
BEFORE UPDATE ON collections
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 2.10 Collection Products Mapping
CREATE TABLE collection_products (
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (collection_id, product_id)
);


-- =========================================================================
-- SECTION 3: COMMERCE (CARTS, ORDERS, PAYMENTS, COUPONS, GIFT CARDS)
-- =========================================================================

-- 3.1 Coupons
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    discount_type VARCHAR(50) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value >= 0),
    min_spend DECIMAL(10,2) DEFAULT 0.00 CHECK (min_spend >= 0),
    max_spend DECIMAL(10,2) CHECK (max_spend >= 0),
    usage_limit INT CHECK (usage_limit >= 1),
    used_count INT DEFAULT 0 NOT NULL CHECK (used_count >= 0),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_coupons
BEFORE UPDATE ON coupons
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 3.2 Gift Cards
CREATE TABLE gift_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    initial_balance DECIMAL(10,2) NOT NULL CHECK (initial_balance >= 0),
    current_balance DECIMAL(10,2) NOT NULL CHECK (current_balance >= 0),
    is_active BOOLEAN DEFAULT true NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_gift_cards
BEFORE UPDATE ON gift_cards
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 3.3 Carts
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT cart_owner_check CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE TRIGGER set_timestamp_carts
BEFORE UPDATE ON carts
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 3.4 Cart Items
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID REFERENCES carts(id) ON DELETE CASCADE NOT NULL,
    variant_id UUID REFERENCES variants(id) ON DELETE CASCADE NOT NULL,
    quantity INT DEFAULT 1 NOT NULL CHECK (quantity >= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (cart_id, variant_id)
);

CREATE TRIGGER set_timestamp_cart_items
BEFORE UPDATE ON cart_items
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 3.5 Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    shipping_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    payment_status VARCHAR(100) DEFAULT 'pending' NOT NULL CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    shipping_status VARCHAR(100) DEFAULT 'pending' NOT NULL CHECK (shipping_status IN ('pending', 'shipped', 'delivered', 'returned')),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    discount DECIMAL(10,2) DEFAULT 0.00 NOT NULL CHECK (discount >= 0),
    shipping_fee DECIMAL(10,2) DEFAULT 0.00 NOT NULL CHECK (shipping_fee >= 0),
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    coupon_code VARCHAR(100) REFERENCES coupons(code) ON DELETE SET NULL,
    loyalty_points_used INT DEFAULT 0 NOT NULL CHECK (loyalty_points_used >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_orders
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 3.6 Order Items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    variant_id UUID REFERENCES variants(id) ON DELETE SET NULL,
    quantity INT NOT NULL CHECK (quantity >= 1),
    price_azn DECIMAL(10,2) NOT NULL CHECK (price_azn >= 0),
    total_azn DECIMAL(10,2) NOT NULL CHECK (total_azn >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_order_items
BEFORE UPDATE ON order_items
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 3.7 Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    transaction_id VARCHAR(255),
    status VARCHAR(100) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_payments
BEFORE UPDATE ON payments
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


-- =========================================================================
-- SECTION 4: FULFILLMENT (INVENTORY, WAREHOUSES, SHIPMENTS, RETURNS, REFUNDS)
-- =========================================================================

-- 4.1 Warehouses
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    location TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_warehouses
BEFORE UPDATE ON warehouses
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 4.2 Inventory
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
    variant_id UUID REFERENCES variants(id) ON DELETE CASCADE NOT NULL,
    quantity INT DEFAULT 0 NOT NULL CHECK (quantity >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (warehouse_id, variant_id)
);

CREATE TRIGGER set_timestamp_inventory
BEFORE UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 4.3 Shipments
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    tracking_number VARCHAR(100),
    carrier VARCHAR(100),
    status VARCHAR(100) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'shipped', 'delivered', 'returned', 'cancelled')),
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_shipments
BEFORE UPDATE ON shipments
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 4.4 Returns
CREATE TABLE returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(100) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_returns
BEFORE UPDATE ON returns
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 4.5 Return Items
CREATE TABLE return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID REFERENCES returns(id) ON DELETE CASCADE NOT NULL,
    variant_id UUID REFERENCES variants(id) ON DELETE CASCADE NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_return_items
BEFORE UPDATE ON return_items
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 4.6 Refunds
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID REFERENCES returns(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    status VARCHAR(100) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_refunds
BEFORE UPDATE ON refunds
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


-- =========================================================================
-- SECTION 5: CRM / SYSTEM (TICKETS, NOTIFICATIONS, REVIEWS, WISH/COMPARE, ETC.)
-- =========================================================================

-- 5.1 Tickets (Support)
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(100) DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'in_progress', 'closed')),
    priority VARCHAR(50) DEFAULT 'medium' NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_tickets
BEFORE UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 5.2 Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title_az VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    title_ru VARCHAR(255) NOT NULL,
    message_az TEXT NOT NULL,
    message_en TEXT NOT NULL,
    message_ru TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_notifications
BEFORE UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 5.3 Reviews
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_reviews
BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 5.4 Wishlists
CREATE TABLE wishlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    variant_id UUID REFERENCES variants(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, variant_id)
);

CREATE TRIGGER set_timestamp_wishlists
BEFORE UPDATE ON wishlists
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 5.5 Compare Lists
CREATE TABLE compare_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, product_id)
);

CREATE TRIGGER set_timestamp_compare_lists
BEFORE UPDATE ON compare_lists
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 5.6 Blog Posts
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_az VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    title_ru VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content_az TEXT NOT NULL,
    content_en TEXT NOT NULL,
    content_ru TEXT NOT NULL,
    featured_image TEXT,
    is_published BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_blog_posts
BEFORE UPDATE ON blog_posts
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 5.7 Pages (CMS Pages)
CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_az VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    title_ru VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content_az TEXT NOT NULL,
    content_en TEXT NOT NULL,
    content_ru TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_pages
BEFORE UPDATE ON pages
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 5.8 Banners
CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_az VARCHAR(255),
    title_en VARCHAR(255),
    title_ru VARCHAR(255),
    subtitle_az VARCHAR(255),
    subtitle_en VARCHAR(255),
    subtitle_ru VARCHAR(255),
    image_url TEXT NOT NULL,
    link_url TEXT,
    location VARCHAR(100) DEFAULT 'hero' NOT NULL CHECK (location IN ('hero', 'promo', 'sidebar', 'footer')),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_banners
BEFORE UPDATE ON banners
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 5.9 System Settings
CREATE TABLE settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_settings
BEFORE UPDATE ON settings
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 5.10 Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5.11 Third-party Integrations config
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_integrations
BEFORE UPDATE ON integrations
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 5.12 Digital Files Manager
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_files
BEFORE UPDATE ON files
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 5.13 Loyalty Points History
CREATE TABLE loyalty_points_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    points INT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'refunded', 'manual_adjustment')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5.14 Referral Records
CREATE TABLE referral_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    referred_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reward_status VARCHAR(100) DEFAULT 'pending' NOT NULL CHECK (reward_status IN ('pending', 'rewarded', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (referred_id)
);

CREATE TRIGGER set_timestamp_referral_records
BEFORE UPDATE ON referral_records
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 5.15 Service Requests
CREATE TABLE service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    service_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(100) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TRIGGER set_timestamp_service_requests
BEFORE UPDATE ON service_requests
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


-- =========================================================================
-- SECTION 6: ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all tables
ALTER TABLE customer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE compare_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Dynamic RLS Helpers: Checks if current user has 'admin' or 'manager' metadata/role
CREATE OR REPLACE FUNCTION current_user_is_admin_or_manager()
RETURNS BOOLEAN AS $$
DECLARE
  v_role VARCHAR;
BEGIN
  -- We lookup from profiles table which caches auth roles
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  RETURN (v_role = 'admin' OR v_role = 'manager');
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6.1 PROFILES POLICIES
CREATE POLICY "Public profiles read-access" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin/Manager full profile access" ON profiles
    FOR ALL USING (current_user_is_admin_or_manager());

-- 6.2 CATALOG POLICIES (Read for all, Write for Admins)
CREATE POLICY "Public read products" ON products FOR SELECT USING (is_active = true OR current_user_is_admin_or_manager());
CREATE POLICY "Admin write products" ON products FOR ALL USING (current_user_is_admin_or_manager());

CREATE POLICY "Public read brands" ON brands FOR SELECT USING (true);
CREATE POLICY "Admin write brands" ON brands FOR ALL USING (current_user_is_admin_or_manager());

CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Admin write categories" ON categories FOR ALL USING (current_user_is_admin_or_manager());

CREATE POLICY "Public read variants" ON variants FOR SELECT USING (true);
CREATE POLICY "Admin write variants" ON variants FOR ALL USING (current_user_is_admin_or_manager());

CREATE POLICY "Public read collections" ON collections FOR SELECT USING (is_active = true OR current_user_is_admin_or_manager());
CREATE POLICY "Admin write collections" ON collections FOR ALL USING (current_user_is_admin_or_manager());

-- Same read-write structure for schema meta-tables
CREATE POLICY "Public read product_categories" ON product_categories FOR SELECT USING (true);
CREATE POLICY "Admin write product_categories" ON product_categories FOR ALL USING (current_user_is_admin_or_manager());

CREATE POLICY "Public read attributes" ON attributes FOR SELECT USING (true);
CREATE POLICY "Admin write attributes" ON attributes FOR ALL USING (current_user_is_admin_or_manager());

CREATE POLICY "Public read attribute_values" ON attribute_values FOR SELECT USING (true);
CREATE POLICY "Admin write attribute_values" ON attribute_values FOR ALL USING (current_user_is_admin_or_manager());

CREATE POLICY "Public read variant_attribute_values" ON variant_attribute_values FOR SELECT USING (true);
CREATE POLICY "Admin write variant_attribute_values" ON variant_attribute_values FOR ALL USING (current_user_is_admin_or_manager());

CREATE POLICY "Public read collection_products" ON collection_products FOR SELECT USING (true);
CREATE POLICY "Admin write collection_products" ON collection_products FOR ALL USING (current_user_is_admin_or_manager());

-- 6.3 COMMERCE POLICIES
CREATE POLICY "Users can view own carts" ON carts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own carts" ON carts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own cart items" ON cart_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid())
);
CREATE POLICY "Users can manage own cart items" ON cart_items FOR ALL USING (
    EXISTS (SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid())
);

CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Admin manage orders" ON orders FOR ALL USING (current_user_is_admin_or_manager());

CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Admin manage order items" ON order_items FOR ALL USING (current_user_is_admin_or_manager());

-- 6.4 FULFILLMENT, INTEGRATIONS AND CRM SYSTEM POLICIES
CREATE POLICY "Admin/Manager full inventory access" ON inventory FOR ALL USING (current_user_is_admin_or_manager());
CREATE POLICY "Admin/Manager full warehouses access" ON warehouses FOR ALL USING (current_user_is_admin_or_manager());
CREATE POLICY "Admin/Manager full shipments access" ON shipments FOR ALL USING (current_user_is_admin_or_manager());

CREATE POLICY "Users can view own return records" ON returns FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = returns.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Users can request return records" ON returns FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Admin manage returns" ON returns FOR ALL USING (current_user_is_admin_or_manager());

CREATE POLICY "Users can view own support tickets" ON tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create support tickets" ON tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin manage support tickets" ON tickets FOR ALL USING (current_user_is_admin_or_manager());

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Public read approved reviews" ON reviews FOR SELECT USING (is_approved = true OR auth.uid() = user_id OR current_user_is_admin_or_manager());
CREATE POLICY "Users can insert reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin/Manager full reviews control" ON reviews FOR ALL USING (current_user_is_admin_or_manager());

CREATE POLICY "Users can manage own wishlists" ON wishlists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own compare lists" ON compare_lists FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public read blog posts" ON blog_posts FOR SELECT USING (is_published = true OR current_user_is_admin_or_manager());
CREATE POLICY "Admin manage blog posts" ON blog_posts FOR ALL USING (current_user_is_admin_or_manager());

CREATE POLICY "Public read CMS pages" ON pages FOR SELECT USING (true);
CREATE POLICY "Admin manage CMS pages" ON pages FOR ALL USING (current_user_is_admin_or_manager());

CREATE POLICY "Public read banners" ON banners FOR SELECT USING (is_active = true OR current_user_is_admin_or_manager());
CREATE POLICY "Admin manage banners" ON banners FOR ALL USING (current_user_is_admin_or_manager());

CREATE POLICY "Public read global settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Admin manage global settings" ON settings FOR ALL USING (current_user_is_admin_or_manager());

CREATE POLICY "Users can view own loyalty points logs" ON loyalty_points_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own referral status" ON referral_records FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "Users can view own service requests" ON service_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own service requests" ON service_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Restricting direct public access to sensitive logging tables
CREATE POLICY "Admin manage audit logs" ON audit_logs FOR ALL USING (current_user_is_admin_or_manager());
CREATE POLICY "Admin manage integrations" ON integrations FOR ALL USING (current_user_is_admin_or_manager());
