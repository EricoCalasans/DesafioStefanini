import { describe, expect, it } from 'vitest';
import {
  calculateDiscount,
  calculateLineSubtotal,
  calculateSubtotal,
  MAX_SUBTOTAL_CENTS,
  toSafeInteger,
} from '../src/domain/money.js';

describe('money rules', () => {
  it('calculates line totals with integer cents', () => {
    expect(calculateLineSubtotal(19_999n, 3)).toBe(59_997n);
    expect(() => calculateLineSubtotal(0n, 1)).toThrow(RangeError);
    expect(() => calculateLineSubtotal(1n, 10_001)).toThrow(RangeError);
  });

  it('rejects an order subtotal over the domain limit', () => {
    expect(calculateSubtotal([MAX_SUBTOTAL_CENTS])).toBe(MAX_SUBTOTAL_CENTS);
    expect(() => calculateSubtotal([MAX_SUBTOTAL_CENTS, 1n])).toThrow(/subtotal/i);
    expect(() => calculateSubtotal([])).toThrow(RangeError);
  });

  it('uses the inclusive threshold and rounds half up once', () => {
    const policy = { enabled: true, thresholdCents: 500n, rateBps: 1_000 };
    expect(calculateDiscount(499n, policy)).toEqual({ amountCents: 0n, applied: false });
    expect(calculateDiscount(500n, policy)).toEqual({ amountCents: 50n, applied: true });
    expect(calculateDiscount(5n, { ...policy, thresholdCents: 0n })).toEqual({
      amountCents: 1n,
      applied: true,
    });
  });

  it('supports disabled, zero, and full-rate policies without negative totals', () => {
    expect(
      calculateDiscount(10_000n, { enabled: false, thresholdCents: 0n, rateBps: 10_000 }),
    ).toEqual({ amountCents: 0n, applied: false });
    expect(calculateDiscount(10_000n, { enabled: true, thresholdCents: 0n, rateBps: 0 })).toEqual({
      amountCents: 0n,
      applied: false,
    });
    expect(
      calculateDiscount(10_000n, { enabled: true, thresholdCents: 0n, rateBps: 10_000 }),
    ).toEqual({ amountCents: 10_000n, applied: true });
  });

  it('refuses unsafe JSON number conversion', () => {
    expect(toSafeInteger(9_007_199_254_740_991n, 'amount')).toBe(Number.MAX_SAFE_INTEGER);
    expect(() => toSafeInteger(9_007_199_254_740_992n, 'amount')).toThrow(RangeError);
  });
});
