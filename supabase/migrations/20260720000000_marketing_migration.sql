-- Marketing Migration
-- 1. Alter coupons to add active status if not exists
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- 2. Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    discount_percent DECIMAL(5,2) NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('all', 'category', 'product')),
    target_ids JSONB DEFAULT '[]'::jsonb, -- holds array of category/product UUIDs/slugs
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Trigger for updating updated_at on campaigns
CREATE TRIGGER set_timestamp_campaigns
BEFORE UPDATE ON campaigns
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
