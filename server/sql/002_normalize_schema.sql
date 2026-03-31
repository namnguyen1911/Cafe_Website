BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. users: add first_name / last_name, backfill from name
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;

UPDATE users
SET
  first_name = COALESCE(
    NULLIF(trim(first_name), ''),
    NULLIF(split_part(trim(name), ' ', 1), ''),
    'Unknown'
  ),
  last_name = COALESCE(
    NULLIF(trim(last_name), ''),
    NULLIF(trim(substring(trim(name) FROM length(split_part(trim(name), ' ', 1)) + 1)), ''),
    'User'
  )
WHERE
  first_name IS NULL OR trim(first_name) = '' OR
  last_name IS NULL OR trim(last_name) = '';


ALTER TABLE users
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name SET NOT NULL;

ALTER TABLE users
  ADD CONSTRAINT users_first_name_not_blank CHECK (length(trim(first_name)) > 0),
  ADD CONSTRAINT users_last_name_not_blank CHECK (length(trim(last_name)) > 0);

-- 2. products: add business-rule constraints
ALTER TABLE products
  ADD CONSTRAINT products_name_not_blank CHECK (length(trim(name)) > 0),
  ADD CONSTRAINT products_price_non_negative CHECK (price >= 0),
  ADD CONSTRAINT products_offer_price_non_negative CHECK (offer_price >= 0),
  ADD CONSTRAINT products_offer_price_lte_price CHECK (offer_price <= price),
  ADD CONSTRAINT products_category_not_blank CHECK (length(trim(category)) > 0);

-- 3. create new child tables
CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  UNIQUE (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS product_description_lines (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  line_order INTEGER NOT NULL CHECK (line_order >= 0),
  content TEXT NOT NULL CHECK (length(trim(content)) > 0),
  UNIQUE(product_id, line_order)
);

CREATE TABLE IF NOT EXISTS product_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL CHECK (length(trim(image_url)) > 0),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  UNIQUE(product_id, sort_order)
);

-- 4. backfill cart_items from users.cart_items JSONB
INSERT INTO cart_items (id, user_id, product_id, quantity)
SELECT
  gen_random_uuid()::text,
  u.id,
  p.id,
  (kv.value)::integer
FROM users u
CROSS JOIN LATERAL jsonb_each_text(u.cart_items) AS kv(key, value)
JOIN products p ON p.id = kv.key
ON CONFLICT (user_id, product_id)
DO UPDATE SET quantity = EXCLUDED.quantity;

-- 5. backfill product_description_lines from products.description JSONB array
INSERT INTO product_description_lines (id, product_id, line_order, content)
SELECT
  gen_random_uuid()::text,
  p.id,
  d.ordinality - 1,
  trim(d.value)
FROM products p
CROSS JOIN LATERAL jsonb_array_elements_text(p.description) WITH ORDINALITY AS d(value, ordinality)
WHERE length(trim(d.value)) > 0
ON CONFLICT (product_id, line_order) DO NOTHING;

-- 6. backfill product_images from products.image JSONB array
INSERT INTO product_images (id, product_id, image_url, sort_order)
SELECT
  gen_random_uuid()::text,
  p.id,
  trim(i.value),
  i.ordinality - 1
FROM products p
CROSS JOIN LATERAL jsonb_array_elements_text(p.image) WITH ORDINALITY AS i(value, ordinality)
WHERE length(trim(i.value)) > 0
ON CONFLICT (product_id, sort_order) DO NOTHING;

-- 7. order_items: add snapshot columns
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS product_name TEXT,
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS unit_offer_price NUMERIC(12,2);

-- 8. backfill order_items snapshot fields from current products
UPDATE order_items oi
SET
  product_name = p.name,
  unit_price = p.price,
  unit_offer_price = p.offer_price
FROM products p
WHERE oi.product_id = p.id
  AND (
    oi.product_name IS NULL OR
    oi.unit_price IS NULL OR
    oi.unit_offer_price IS NULL
  );

ALTER TABLE order_items
  ALTER COLUMN product_name SET NOT NULL,
  ALTER COLUMN unit_price SET NOT NULL,
  ALTER COLUMN unit_offer_price SET NOT NULL;

ALTER TABLE order_items
  ADD CONSTRAINT order_items_product_name_not_blank CHECK (length(trim(product_name)) > 0),
  ADD CONSTRAINT order_items_unit_price_non_negative CHECK (unit_price >= 0),
  ADD CONSTRAINT order_items_unit_offer_price_non_negative CHECK (unit_offer_price >= 0),
  ADD CONSTRAINT order_items_unit_offer_price_lte_unit_price CHECK (unit_offer_price <= unit_price);

-- 9. address/order constraints
ALTER TABLE addresses
  ADD CONSTRAINT addresses_first_name_not_blank CHECK (length(trim(first_name)) > 0),
  ADD CONSTRAINT addresses_last_name_not_blank CHECK (length(trim(last_name)) > 0),
  ADD CONSTRAINT addresses_street_not_blank CHECK (length(trim(street)) > 0),
  ADD CONSTRAINT addresses_city_not_blank CHECK (length(trim(city)) > 0),
  ADD CONSTRAINT addresses_state_not_blank CHECK (length(trim(state)) > 0),
  ADD CONSTRAINT addresses_country_not_blank CHECK (length(trim(country)) > 0);

ALTER TABLE orders
  ADD CONSTRAINT orders_amount_non_negative CHECK (amount >= 0);

-- 10. indexes
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

COMMIT;
