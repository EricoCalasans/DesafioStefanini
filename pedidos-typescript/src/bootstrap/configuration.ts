export interface OrdersConfiguration {
  readonly port: number;
  readonly databaseUrl: string;
  readonly migrationDatabaseUrl: string;
  readonly catalogUrl: string;
  readonly discount: DiscountPolicy;
}

export interface DiscountPolicy {
  readonly ruleId: string;
  readonly enabled: boolean;
  readonly thresholdCents: bigint;
  readonly rateBps: number;
  readonly rounding: 'HALF_UP';
}

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name];
  if (!value || value.trim() !== value) {
    throw new Error(`${name} is required and must not contain surrounding whitespace.`);
  }
  return value;
}

function parseDecimal(name: string, value: string, min: bigint, max: bigint): bigint {
  if (!/^(0|[1-9][0-9]*)$/.test(value)) {
    throw new Error(`${name} must be an unsigned decimal integer.`);
  }
  const parsed = BigInt(value);
  if (parsed < min || parsed > max) {
    throw new Error(`${name} is outside its allowed range.`);
  }
  return parsed;
}

function parseHttpUrl(name: string, value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid URL.`);
  }
  if (
    !['http:', 'https:'].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.hash
  ) {
    throw new Error(`${name} must be an HTTP(S) URL without credentials or a fragment.`);
  }
  return parsed.toString().replace(/\/$/, '');
}

function parsePostgresUrl(name: string, value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be a PostgreSQL connection URL.`);
  }
  if (
    !['postgres:', 'postgresql:'].includes(parsed.protocol) ||
    !parsed.hostname ||
    !parsed.pathname
  ) {
    throw new Error(`${name} must be a PostgreSQL connection URL.`);
  }
  return value;
}

export function loadMigrationDatabaseUrl(env: NodeJS.ProcessEnv): string {
  return parsePostgresUrl(
    'ORDERS_MIGRATION_DATABASE_URL',
    required(env, 'ORDERS_MIGRATION_DATABASE_URL'),
  );
}

export function loadOrdersConfiguration(env: NodeJS.ProcessEnv): OrdersConfiguration {
  const portValue = parseDecimal('ORDERS_PORT', env.ORDERS_PORT ?? '3000', 1n, 65_535n);
  const enabledValue = required(env, 'DISCOUNT_ENABLED');
  if (enabledValue !== 'true' && enabledValue !== 'false') {
    throw new Error('DISCOUNT_ENABLED must be exactly true or false.');
  }

  const ruleId = required(env, 'DISCOUNT_RULE_ID');
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(ruleId)) {
    throw new Error('DISCOUNT_RULE_ID has an invalid format.');
  }

  const threshold = parseDecimal(
    'DISCOUNT_MIN_SUBTOTAL_CENTS',
    required(env, 'DISCOUNT_MIN_SUBTOTAL_CENTS'),
    0n,
    1_000_000_000_000n,
  );
  const rate = parseDecimal('DISCOUNT_RATE_BPS', required(env, 'DISCOUNT_RATE_BPS'), 0n, 10_000n);

  const discount: DiscountPolicy = Object.freeze({
    ruleId,
    enabled: enabledValue === 'true',
    thresholdCents: threshold,
    rateBps: Number(rate),
    rounding: 'HALF_UP',
  });

  return Object.freeze({
    port: Number(portValue),
    databaseUrl: parsePostgresUrl('ORDERS_DATABASE_URL', required(env, 'ORDERS_DATABASE_URL')),
    migrationDatabaseUrl: loadMigrationDatabaseUrl(env),
    catalogUrl: parseHttpUrl('CATALOG_URL', required(env, 'CATALOG_URL')),
    discount,
  });
}
