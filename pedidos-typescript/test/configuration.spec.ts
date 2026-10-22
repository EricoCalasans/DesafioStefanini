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
    ['DISCOUNT_RULE_ID', 'rule with spaces'],
    ['DISCOUNT_MIN_SUBTOTAL_CENTS', '-1'],
    ['DISCOUNT_RATE_BPS', '10001'],
    ['ORDERS_PORT', '3000.5'],
    ['CATALOG_URL', 'ftp://localhost:8080'],
    ['ORDERS_DATABASE_URL', 'http://localhost/orders'],
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
});
