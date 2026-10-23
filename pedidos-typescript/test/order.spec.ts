import { describe, expect, it } from 'vitest';
import type { DiscountPolicy } from '../src/bootstrap/configuration.js';
import { type CatalogProduct, createOrder } from '../src/domain/order.js';

const firstId = '11111111-1111-4111-8111-111111111111';
const secondId = '22222222-2222-4222-8222-222222222222';
const observedAt = '2026-10-22T12:00:00.000Z';
const policy: DiscountPolicy = {
  ruleId: 'test-v1',
  enabled: true,
  thresholdCents: 50_000n,
  rateBps: 1_000,
  rounding: 'HALF_UP',
};

function product(id: string, sku: string, priceCents: bigint, active = true): CatalogProduct {
  return {
    id,
    sku,
    name: `Product ${sku}`,
    currency: 'BRL',
    priceCents,
    active,
    priceVersion: 3,
    updatedAt: observedAt,
  };
}

function createOrderFor(
  requestedItems: readonly { productId: string; quantity: number }[],
  products: readonly CatalogProduct[],
) {
  return createOrder({
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    customer: { name: 'Cliente', email: 'cliente@example.com' },
    requestedItems,
    products,
    policy,
    pricingObservedAt: observedAt,
    createdAt: observedAt,
  });
}

describe('order domain aggregate', () => {
  it('preserves requested line order and snapshots the pricing decision', () => {
    const order = createOrderFor(
      [
        { productId: secondId, quantity: 1 },
        { productId: firstId, quantity: 2 },
      ],
      [product(firstId, 'KEYBOARD', 20_000n), product(secondId, 'MOUSE', 10_000n)],
    );

    expect(order.items.map(({ productId, lineNumber }) => [productId, lineNumber])).toEqual([
      [secondId, 1],
      [firstId, 2],
    ]);
    expect(order.items[0]).toMatchObject({
      sku: 'MOUSE',
      unitPriceCents: 10_000n,
      lineSubtotalCents: 10_000n,
      priceVersion: 3,
      productUpdatedAt: observedAt,
    });
    expect(order).toMatchObject({
      currency: 'BRL',
      subtotalCents: 50_000n,
      discount: { applied: true, amountCents: 5_000n, policy },
      totalCents: 45_000n,
      status: 'CREATED',
      pricingObservedAt: observedAt,
      createdAt: observedAt,
    });
  });

  it('rejects products that have not been validated as active', () => {
    expect(() => createOrderFor([{ productId: firstId, quantity: 1 }], [])).toThrow(
      'Only validated active catalog products can be ordered.',
    );
    expect(() =>
      createOrderFor(
        [{ productId: firstId, quantity: 1 }],
        [product(firstId, 'KEYBOARD', 20_000n, false)],
      ),
    ).toThrow('Only validated active catalog products can be ordered.');
  });

  it('delegates quantity, price, and non-empty order invariants to money rules', () => {
    const activeProduct = product(firstId, 'KEYBOARD', 20_000n);
    expect(() => createOrderFor([{ productId: firstId, quantity: 0 }], [activeProduct])).toThrow(
      RangeError,
    );
    expect(() =>
      createOrderFor([{ productId: firstId, quantity: 10_001 }], [activeProduct]),
    ).toThrow(RangeError);
    expect(() =>
      createOrderFor([{ productId: firstId, quantity: 1 }], [product(firstId, 'KEYBOARD', 0n)]),
    ).toThrow(RangeError);
    expect(() => createOrderFor([], [])).toThrow(RangeError);
  });
});
