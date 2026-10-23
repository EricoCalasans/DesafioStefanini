import { describe, expect, it } from 'vitest';
import { loadOrdersConfiguration } from '../src/bootstrap/configuration.js';

function validEnvironment(): NodeJS.ProcessEnv {
  return {
    ORDERS_PORT: '3000',
    ORDERS_DATABASE_URL: 'postgresql://runtime:secret@localhost:5432/orders',
    ORDERS_MIGRATION_DATABASE_URL: 'postgresql://migrator:secret@localhost:5432/orders',
    CATALOG_URL: 'http://localhost:8080/',
    DISCOUNT_ENABLED: 'true',
    DISCOUNT_RULE_ID: 'volume-v1',
    DISCOUNT_MIN_SUBTOTAL_CENTS: '50000',
    DISCOUNT_RATE_BPS: '1000',
  };
}

describe('orders configuration', () => {
  it('loads immutable, validated values and normalizes the service URL', () => {
    const result = loadOrdersConfiguration(validEnvironment());
    expect(result.catalogUrl).toBe('http://localhost:8080');
    expect(result.discount).toEqual({
      ruleId: 'volume-v1',
      enabled: true,
      thresholdCents: 50_000n,
      rateBps: 1_000,
      rounding: 'HALF_UP',
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.discount)).toBe(true);
  });

  it.each([
    ['DISCOUNT_ENABLED', 'TRUE'],
    ['DISCOUNT_RULE_ID', ' rule-v1'],
    ['DISCOUNT_RULE_ID', 'rule with spaces'],
    ['DISCOUNT_MIN_SUBTOTAL_CENTS', '-1'],
    ['DISCOUNT_RATE_BPS', '10001'],
    ['ORDERS_PORT', '3000.5'],
    ['CATALOG_URL', 'ftp://localhost:8080'],
    ['CATALOG_URL', 'not a URL'],
    ['CATALOG_URL', 'http://user:secret@localhost:8080'],
    ['CATALOG_URL', 'http://localhost:8080/#fragment'],
    ['ORDERS_DATABASE_URL', 'http://localhost/orders'],
    ['ORDERS_DATABASE_URL', 'not a URL'],
    ['ORDERS_DATABASE_URL', 'postgresql:///orders'],
  ])('rejects invalid %s', (key, value) => {
    const environment = validEnvironment();
    environment[key] = value;
    expect(() => loadOrdersConfiguration(environment)).toThrow();
  });

  it('requires every policy field even when discounts are disabled', () => {
    const environment = validEnvironment();
    environment.DISCOUNT_ENABLED = 'false';
    delete environment.DISCOUNT_RATE_BPS;
    expect(() => loadOrdersConfiguration(environment)).toThrow(/DISCOUNT_RATE_BPS/);
  });

  it('applies documented defaults and accepts the inclusive configuration maxima', () => {
    const environment = validEnvironment();
    delete environment.ORDERS_PORT;
    environment.DISCOUNT_MIN_SUBTOTAL_CENTS = '1000000000000';
    environment.DISCOUNT_RATE_BPS = '10000';

    expect(loadOrdersConfiguration(environment)).toMatchObject({
      port: 3000,
      discount: { thresholdCents: 1_000_000_000_000n, rateBps: 10_000 },
    });

    environment.ORDERS_PORT = '65535';
    expect(loadOrdersConfiguration(environment).port).toBe(65_535);
  });
});
