CREATE TABLE orders (
  id UUID PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL CHECK (length(customer_name) BETWEEN 1 AND 120),
  customer_email VARCHAR(254) NOT NULL CHECK (length(customer_email) BETWEEN 3 AND 254),
  currency CHAR(3) NOT NULL CHECK (currency = 'BRL'),
  status VARCHAR(16) NOT NULL DEFAULT 'CREATED' CHECK (status = 'CREATED'),
  subtotal_cents BIGINT NOT NULL CHECK (subtotal_cents BETWEEN 1 AND 1000000000000),
  discount_amount_cents BIGINT NOT NULL CHECK (discount_amount_cents BETWEEN 0 AND subtotal_cents),
  total_cents BIGINT NOT NULL CHECK (total_cents = subtotal_cents - discount_amount_cents),
  discount_enabled BOOLEAN NOT NULL,
  discount_rule_id VARCHAR(64) NOT NULL CHECK (discount_rule_id ~ '^[A-Za-z0-9_-]{1,64}$'),
  discount_threshold_cents BIGINT NOT NULL CHECK (discount_threshold_cents BETWEEN 0 AND 1000000000000),
  discount_rate_bps INTEGER NOT NULL CHECK (discount_rate_bps BETWEEN 0 AND 10000),
  discount_rounding VARCHAR(16) NOT NULL CHECK (discount_rounding = 'HALF_UP'),
  item_count INTEGER NOT NULL CHECK (item_count BETWEEN 1 AND 100),
  pricing_observed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE order_items (
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL CHECK (line_number BETWEEN 1 AND 100),
  product_id UUID NOT NULL,
  product_sku VARCHAR(40) NOT NULL CHECK (length(product_sku) BETWEEN 1 AND 40),
  product_name VARCHAR(120) NOT NULL CHECK (length(product_name) BETWEEN 1 AND 120),
  unit_price_cents BIGINT NOT NULL CHECK (unit_price_cents BETWEEN 1 AND 100000000),
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 10000),
  line_subtotal_cents BIGINT NOT NULL CHECK (
    line_subtotal_cents = unit_price_cents * quantity::BIGINT AND line_subtotal_cents <= 1000000000000
  ),
  product_price_version INTEGER NOT NULL CHECK (product_price_version >= 1),
  product_updated_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (order_id, line_number),
  UNIQUE (order_id, product_id)
);

CREATE INDEX ix_orders_created_id_desc ON orders (created_at DESC, id DESC);
