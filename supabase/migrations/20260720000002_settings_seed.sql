-- Seed default settings keys if they do not exist
-- Key: general, localization, shipping, payment

INSERT INTO settings (key, value)
VALUES 
('general', '{
  "storeName": "RubikShop.az",
  "contactEmail": "info@rubikshop.az",
  "contactPhone": "+994 50 000 00 00",
  "address": "Bakı şəhəri, Azərbaycan"
}'::jsonb),

('localization', '{
  "currency": "AZN",
  "currencyFormat": "{{amount}} ₼",
  "languages": [
    { "code": "az", "name": "Azərbaycan", "active": true, "default": true },
    { "code": "en", "name": "İngilis (English)", "active": true, "default": false },
    { "code": "ru", "name": "Rus (Русский)", "active": true, "default": false }
  ]
}'::jsonb),

('shipping', '{
  "taxIncluded": true,
  "taxRate": "0",
  "deliveryMethods": [
    { "id": 1, "name": "Metroya Çatdırılma", "price": 0.00, "time": "1-2 iş günü" },
    { "id": 2, "name": "Ünvana Çatdırılma (Kuryer)", "price": 3.00, "time": "1-2 iş günü" },
    { "id": 3, "name": "Sürətli Çatdırılma (Express)", "price": 7.00, "time": "3 saat ərzində" },
    { "id": 4, "name": "Mağazadan Götürmə", "price": 0.00, "time": "Eyni gün" }
  ]
}'::jsonb),

('payment', '{
  "cashOnDelivery": true,
  "cardToCard": true,
  "whatsappNumber": "+994 50 668 49 25"
}'::jsonb)
ON CONFLICT (key) DO NOTHING;
