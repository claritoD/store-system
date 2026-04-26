-- Seed data for testing
-- Creates 1 admin user, 6 categories, 30 products, 60 variants, and a few sales.

BEGIN;

-- Admin user (password: admin12345) - bcrypt hash generated offline
-- If you want a different password, change it via the app later.
INSERT INTO users (username, password)
SELECT 'admin', '$2b$10$0p7G6wLUFed5NSGyfsVNJeIVSaQSxBuCkUy670k8zWwAYEzKEwDBi'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- Categories
INSERT INTO categories (name, description)
VALUES
  ('Apparel', 'Clothing items'),
  ('Shoes', 'Footwear'),
  ('Watches', 'Wrist watches'),
  ('Bags', 'Bags and wallets'),
  ('Vapes', 'Vape devices and flavors'),
  ('Accessories', 'General accessories')
ON CONFLICT (name) DO NOTHING;

-- Products (30)
WITH cat AS (
  SELECT id, name FROM categories
),
prod AS (
  INSERT INTO products (name, category_id, brand, description, image_url)
  VALUES
    ('Classic T-Shirt', (SELECT id FROM cat WHERE name='Apparel'), 'BasicCo', 'Cotton tee', NULL),
    ('Premium Hoodie', (SELECT id FROM cat WHERE name='Apparel'), 'WarmWear', 'Fleece hoodie', NULL),
    ('Denim Jeans', (SELECT id FROM cat WHERE name='Apparel'), 'BlueLine', 'Regular fit jeans', NULL),
    ('Running Sneakers', (SELECT id FROM cat WHERE name='Shoes'), 'Sprint', 'Lightweight runners', NULL),
    ('Leather Loafers', (SELECT id FROM cat WHERE name='Shoes'), 'GentleStep', 'Formal loafers', NULL),
    ('Canvas High Tops', (SELECT id FROM cat WHERE name='Shoes'), 'StreetKick', 'Classic high tops', NULL),
    ('Quartz Watch', (SELECT id FROM cat WHERE name='Watches'), 'TimePro', 'Everyday quartz watch', NULL),
    ('Sport Watch', (SELECT id FROM cat WHERE name='Watches'), 'ActiveTime', 'Water resistant', NULL),
    ('Leather Strap Watch', (SELECT id FROM cat WHERE name='Watches'), 'ClassicTime', 'Minimal design', NULL),
    ('Mini Sling Bag', (SELECT id FROM cat WHERE name='Bags'), 'CarryOn', 'Compact sling', NULL),
    ('Tote Bag', (SELECT id FROM cat WHERE name='Bags'), 'CarryOn', 'Daily tote', NULL),
    ('Backpack', (SELECT id FROM cat WHERE name='Bags'), 'PackMate', 'School backpack', NULL),
    ('Vape Device A', (SELECT id FROM cat WHERE name='Vapes'), 'VapeX', 'Starter kit', NULL),
    ('Vape Device B', (SELECT id FROM cat WHERE name='Vapes'), 'VapeX', 'Pod system', NULL),
    ('Disposable Vape', (SELECT id FROM cat WHERE name='Vapes'), 'CloudPop', 'Disposable unit', NULL),
    ('Baseball Cap', (SELECT id FROM cat WHERE name='Accessories'), 'TopIt', 'Adjustable cap', NULL),
    ('Sunglasses', (SELECT id FROM cat WHERE name='Accessories'), 'ShadeCo', 'UV protection', NULL),
    ('Wallet', (SELECT id FROM cat WHERE name='Accessories'), 'LeatherLite', 'Slim wallet', NULL),
    ('Belt', (SELECT id FROM cat WHERE name='Accessories'), 'LeatherLite', 'Leather belt', NULL),
    ('Socks Pack', (SELECT id FROM cat WHERE name='Apparel'), 'BasicCo', '3-pack socks', NULL),
    ('Polo Shirt', (SELECT id FROM cat WHERE name='Apparel'), 'BasicCo', 'Collared shirt', NULL),
    ('Sandals', (SELECT id FROM cat WHERE name='Shoes'), 'GentleStep', 'Everyday sandals', NULL),
    ('Dress Shoes', (SELECT id FROM cat WHERE name='Shoes'), 'GentleStep', 'Formal shoes', NULL),
    ('Digital Watch', (SELECT id FROM cat WHERE name='Watches'), 'ActiveTime', 'Digital display', NULL),
    ('Handbag', (SELECT id FROM cat WHERE name='Bags'), 'CarryOn', 'Casual handbag', NULL),
    ('Travel Bag', (SELECT id FROM cat WHERE name='Bags'), 'PackMate', 'Weekend travel', NULL),
    ('Vape Flavor Pods', (SELECT id FROM cat WHERE name='Vapes'), 'CloudPop', 'Flavor pods', NULL),
    ('Bracelet', (SELECT id FROM cat WHERE name='Accessories'), 'Shine', 'Simple bracelet', NULL),
    ('Necklace', (SELECT id FROM cat WHERE name='Accessories'), 'Shine', 'Minimal necklace', NULL),
    ('General Merchandise Item', (SELECT id FROM cat WHERE name='Accessories'), 'Mix', 'Misc item', NULL)
  ON CONFLICT DO NOTHING
  RETURNING id, name, category_id
)
SELECT 1;

-- Variants (60) - 2 variants per product using deterministic SKU pattern
DO $$
DECLARE
  p RECORD;
  v1_sku TEXT;
  v2_sku TEXT;
  base_price NUMERIC(12,2);
BEGIN
  FOR p IN SELECT id, name FROM products ORDER BY id LIMIT 30
  LOOP
    base_price := (10 + (p.id % 50))::NUMERIC(12,2);
    v1_sku := 'SKU-' || p.id || '-A';
    v2_sku := 'SKU-' || p.id || '-B';

    INSERT INTO product_variants (product_id, sku, size, color, extra_attribute, price, stock)
    VALUES
      (p.id, v1_sku,
        CASE
          WHEN p.name ILIKE '%T-Shirt%' OR p.name ILIKE '%Hoodie%' OR p.name ILIKE '%Polo%' THEN 'M'
          WHEN p.name ILIKE '%Sneakers%' OR p.name ILIKE '%Shoes%' OR p.name ILIKE '%Sandals%' OR p.name ILIKE '%Loafers%' THEN '40'
          ELSE NULL
        END,
        CASE
          WHEN p.name ILIKE '%T-Shirt%' OR p.name ILIKE '%Hoodie%' OR p.name ILIKE '%Cap%' THEN 'Black'
          ELSE NULL
        END,
        CASE
          WHEN p.name ILIKE '%Vape%' THEN 'Flavor: Mango'
          WHEN p.name ILIKE '%Watch%' THEN 'Model: A'
          WHEN p.name ILIKE '%Bag%' THEN 'Type: Standard'
          ELSE NULL
        END,
        base_price, 12
      )
    ON CONFLICT (sku) DO NOTHING;

    INSERT INTO product_variants (product_id, sku, size, color, extra_attribute, price, stock)
    VALUES
      (p.id, v2_sku,
        CASE
          WHEN p.name ILIKE '%T-Shirt%' OR p.name ILIKE '%Hoodie%' OR p.name ILIKE '%Polo%' THEN 'L'
          WHEN p.name ILIKE '%Sneakers%' OR p.name ILIKE '%Shoes%' OR p.name ILIKE '%Sandals%' OR p.name ILIKE '%Loafers%' THEN '41'
          ELSE NULL
        END,
        CASE
          WHEN p.name ILIKE '%T-Shirt%' OR p.name ILIKE '%Hoodie%' OR p.name ILIKE '%Cap%' THEN 'White'
          ELSE NULL
        END,
        CASE
          WHEN p.name ILIKE '%Vape%' THEN 'Flavor: Grape'
          WHEN p.name ILIKE '%Watch%' THEN 'Model: B'
          WHEN p.name ILIKE '%Bag%' THEN 'Type: Premium'
          ELSE NULL
        END,
        (base_price + 5), 7
      )
    ON CONFLICT (sku) DO NOTHING;
  END LOOP;
END $$;

-- A couple of sample sales (optional)
-- Note: app will enforce stock checks; this is just for dashboard demo.
INSERT INTO sales (total, payment_method, sale_date)
VALUES
  (199.00, 'Cash', NOW() - INTERVAL '1 day'),
  (349.00, 'GCash', NOW())
RETURNING id;

COMMIT;

