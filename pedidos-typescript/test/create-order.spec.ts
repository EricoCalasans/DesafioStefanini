import { describe, expect, it, vi } from 'vitest';
import { CreateOrderUseCase } from '../src/application/create-order.js';
import { ApplicationError } from '../src/application/errors.js';
import type { CreateOrderDependencies } from '../src/application/ports.js';
import type { CatalogProduct, Order } from '../src/domain/order.js';

const firstId = '11111111-1111-4111-8111-111111111111';
const secondId = '22222222-2222-4222-8222-222222222222';
const observedAt = '2026-10-22T12:00:00.000Z';

function product(id: string, sku: string, name: string, priceCents: bigint): CatalogProduct {
  return {
    id,
    sku,
    name,
    currency: 'BRL',
    priceCents,
    active: true,
    priceVersion: 3,
    updatedAt: observedAt,
  };
}

function dependencies(
  products = [
    product(firstId, 'KEYBOARD', 'Keyboard', 20_000n),
    product(secondId, 'MOUSE', 'Mouse', 10_000n),
  ],
): CreateOrderDependencies & { saved: Order[] } {
  const saved: Order[] = [];
  return {
    saved,
    catalog: {
      queryProducts: vi.fn(async () => ({ products, missingProductIds: [], observedAt })),
    },
    repository: {
      create: vi.fn(async (order) => {
        saved.push(order);
        return order;
      }),
      findById: vi.fn(async () => null),
      list: vi.fn(async () => ({
        data: [],
        meta: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
      })),
      checkReady: vi.fn(async () => undefined),
    },
    policy: {
      ruleId: 'volume-v1',
      enabled: true,
      thresholdCents: 50_000n,
      rateBps: 1_000,
      rounding: 'HALF_UP',
    },
    clock: { now: () => new Date(observedAt) },
    uuidGenerator: { generate: () => 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
  };
}

const input = {
  customer: { name: 'Cliente', email: 'cliente@example.com' },
  items: [
    { productId: firstId, quantity: 2 },
    { productId: secondId, quantity: 1 },
  ],
  correlationId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
};

describe('CreateOrderUseCase', () => {
  it.each([502, 503, 504])(
    'does not persist when the supplier fails with HTTP %s',
    async (status) => {
      const deps = dependencies();
      const failure = new ApplicationError(
        status,
        'CATALOG_TEST_FAILURE',
        'QA',
        'Synthetic failure.',
      );
      vi.mocked(deps.catalog.queryProducts).mockRejectedValue(failure);
      await expect(new CreateOrderUseCase(deps).execute(input)).rejects.toBe(failure);
      expect(deps.repository.create).not.toHaveBeenCalled();
      expect(deps.saved).toHaveLength(0);
    },
  );

  it('fetches the catalog once, snapshots prices, calculates discount, then persists', async () => {
    const deps = dependencies();
    const result = await new CreateOrderUseCase(deps).execute(input);
    expect(deps.catalog.queryProducts).toHaveBeenCalledTimes(1);
    expect(deps.catalog.queryProducts).toHaveBeenCalledWith(
      [firstId, secondId],
      input.correlationId,
    );
    expect(deps.repository.create).toHaveBeenCalledTimes(1);
    expect(result.items.map((item) => item.lineNumber)).toEqual([1, 2]);
    expect(result.subtotalCents).toBe(50_000n);
    expect(result.discount.amountCents).toBe(5_000n);
    expect(result.totalCents).toBe(45_000n);
    expect(result.items[0]?.sku).toBe('KEYBOARD');
    expect(result.items[0]?.priceVersion).toBe(3);
  });

  it('rejects duplicate IDs before contacting Catalog or persistence', async () => {
    const deps = dependencies();
    await expect(
      new CreateOrderUseCase(deps).execute({
        ...input,
        items: [
          { productId: firstId, quantity: 1 },
          { productId: firstId, quantity: 2 },
        ],
      }),
    ).rejects.toMatchObject({ status: 422, code: 'DUPLICATE_PRODUCT_IDS' });
    expect(deps.catalog.queryProducts).not.toHaveBeenCalled();
    expect(deps.repository.create).not.toHaveBeenCalled();
  });

  it.each([
    [503, 'CATALOG_UNAVAILABLE'],
    [504, 'CATALOG_TIMEOUT'],
    [502, 'CATALOG_INVALID_RESPONSE'],
  ] as const)('does not persist when Catalog returns a %s failure', async (status, code) => {
    const deps = dependencies();
    vi.mocked(deps.catalog.queryProducts).mockRejectedValueOnce(
      new ApplicationError(status, code, 'Catálogo indisponível', 'Falha sanitizada.'),
    );

    await expect(new CreateOrderUseCase(deps).execute(input)).rejects.toMatchObject({
      status,
      code,
    });
    expect(deps.repository.create).not.toHaveBeenCalled();
  });

  it('rejects missing and inactive products without saving', async () => {
    const missing = dependencies([]);
    vi.mocked(missing.catalog.queryProducts).mockResolvedValue({
      products: [],
      missingProductIds: [firstId, secondId],
      observedAt,
    });
    await expect(new CreateOrderUseCase(missing).execute(input)).rejects.toMatchObject({
      code: 'PRODUCTS_NOT_ORDERABLE',
    });
    expect(missing.repository.create).not.toHaveBeenCalled();

    const inactive = dependencies([
      product(firstId, 'KEYBOARD', 'Keyboard', 20_000n),
      {
        ...product(secondId, 'MOUSE', 'Mouse', 10_000n),
        active: false,
      },
    ]);
    await expect(new CreateOrderUseCase(inactive).execute(input)).rejects.toBeInstanceOf(
      ApplicationError,
    );
    expect(inactive.repository.create).not.toHaveBeenCalled();
  });

  it('maps aggregate subtotal overflow to a business error without persisting', async () => {
    const products = [
      product(firstId, 'KEYBOARD', 'Keyboard', 100_000_000n),
      product(secondId, 'MOUSE', 'Mouse', 100_000_000n),
    ];
    const deps = dependencies(products);
    await expect(
      new CreateOrderUseCase(deps).execute({
        ...input,
        items: [
          { productId: firstId, quantity: 10_000 },
          { productId: secondId, quantity: 10_000 },
        ],
      }),
    ).rejects.toMatchObject({ status: 422, code: 'ORDER_AMOUNT_LIMIT_EXCEEDED' });
    expect(deps.repository.create).not.toHaveBeenCalled();
  });

  it('rethrows non-subtotal domain range errors without converting them to amount-limit errors', async () => {
    const deps = dependencies();
    const invalidQuantity = { ...input, items: [{ productId: firstId, quantity: 0 }] };

    await expect(new CreateOrderUseCase(deps).execute(invalidQuantity)).rejects.toThrow(
      'Quantity is outside the allowed range.',
    );
    expect(deps.repository.create).not.toHaveBeenCalled();
  });
});
