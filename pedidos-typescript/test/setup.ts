process.env.ORDERS_DATABASE_URL ??= 'postgresql://orders_runtime:test@127.0.0.1:5432/orders';
process.env.ORDERS_MIGRATION_DATABASE_URL ??=
  'postgresql://orders_migrator:test@127.0.0.1:5432/orders';
process.env.CATALOG_URL ??= 'http://127.0.0.1:8080';
process.env.DISCOUNT_ENABLED ??= 'true';
process.env.DISCOUNT_RULE_ID ??= 'test-v1';
process.env.DISCOUNT_MIN_SUBTOTAL_CENTS ??= '50000';
process.env.DISCOUNT_RATE_BPS ??= '1000';
