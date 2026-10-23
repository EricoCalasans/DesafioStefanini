import { EventEmitter } from 'node:events';
import { Logger } from '@nestjs/common';
import type { QueryResultRow } from 'pg';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PostgresOrderRepository } from '../src/adapters/postgres-order.repository.js';
import { createOrder, type Order } from '../src/domain/order.js';

const correlationId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const createdAt = '2026-10-22T12:00:00.000Z';
const productId = '11111111-1111-4111-8111-111111111111';

function orderFixture(): Order {
  return createOrder({
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    customer: { name: 'Cliente', email: 'cliente@example.com' },
    requestedItems: [{ productId, quantity: 2 }],
    products: [
      {
        id: productId,
        sku: 'TECLADO',
        name: 'Teclado',
        currency: 'BRL',
        priceCents: 20_000n,
        active: true,
        priceVersion: 4,
        updatedAt: createdAt,
      },
    ],
    policy: {
      ruleId: 'volume-v1',
      enabled: false,
      thresholdCents: 50_000n,
      rateBps: 1_000,
      rounding: 'HALF_UP',
    },
    pricingObservedAt: createdAt,
    createdAt,
  });
}

function databaseRow(order: Order): Record<string, unknown> {
  const item = order.items[0];
  if (!item) throw new Error('Fixture must have an item.');
  return {
    id: order.id,
    customer_name: order.customer.name,
    customer_email: order.customer.email,
    currency: 'BRL',
    subtotal_cents: order.subtotalCents.toString(),
    discount_amount_cents: order.discount.amountCents.toString(),
    total_cents: order.totalCents.toString(),
    discount_enabled: order.discount.policy.enabled,
    discount_rule_id: order.discount.policy.ruleId,
    discount_threshold_cents: order.discount.policy.thresholdCents.toString(),
    discount_rate_bps: order.discount.policy.rateBps,
    discount_rounding: 'HALF_UP',
    item_count: order.items.length,
    pricing_observed_at: new Date(order.pricingObservedAt),
    created_at: new Date(order.createdAt),
    line_number: item.lineNumber,
    product_id: item.productId,
    product_sku: item.sku,
    product_name: item.productName,
    unit_price_cents: item.unitPriceCents.toString(),
    quantity: item.quantity,
    line_subtotal_cents: item.lineSubtotalCents.toString(),
    product_price_version: item.priceVersion,
    product_updated_at: new Date(item.productUpdatedAt),
  };
}

function fakeClient(
  respond: (
    statement: string,
    values?: readonly unknown[],
  ) =>
    | Promise<{
        rows: unknown[];
        rowCount: number | null;
      }>
    | { rows: unknown[]; rowCount: number | null },
) {
  const client = new EventEmitter() as EventEmitter & {
    query: (
      statement: string,
      values?: readonly unknown[],
    ) => Promise<{
      rows: unknown[];
      rowCount: number | null;
    }>;
    release: () => void;
  };
  const query = vi.fn((statement: string, values?: readonly unknown[]) =>
    Promise.resolve(respond(statement, values)),
  );
  client.query = query;
  client.release = vi.fn();
  return { client, query };
}

function fakeRepository(
  respond: (
    statement: string,
    values?: readonly unknown[],
  ) =>
    | Promise<{
        rows: unknown[];
        rowCount: number | null;
      }>
    | { rows: unknown[]; rowCount: number | null },
) {
  const connection = fakeClient(respond);
  const pool = {
    connect: vi.fn(async () => connection.client),
    query: vi.fn(async (statement: string, values?: readonly unknown[]) =>
      respond(statement, values),
    ),
  };
  return {
    repository: new PostgresOrderRepository(pool as never),
    pool,
    ...connection,
  };
}

afterEach(() => vi.restoreAllMocks());

describe('PostgresOrderRepository', () => {
  it('creates an order and its items in one parameterized transaction', async () => {
    const { repository, client, query, pool } = fakeRepository((statement) => ({
      rows: [],
      rowCount: statement.includes('INSERT INTO order_items') ? 1 : null,
    }));
    const order = orderFixture();

    await expect(repository.create(order, correlationId)).resolves.toBe(order);

    expect(pool.connect).toHaveBeenCalledOnce();
    expect(query.mock.calls.map(([statement]) => statement)).toEqual([
      'BEGIN',
      expect.stringContaining('INSERT INTO orders'),
      expect.stringContaining('INSERT INTO order_items'),
      'COMMIT',
    ]);
    const headerValues = query.mock.calls[1]?.[1] as unknown[];
    expect(headerValues).toEqual([
      order.id,
      'Cliente',
      'cliente@example.com',
      '40000',
      '0',
      '40000',
      false,
      'volume-v1',
      '50000',
      1_000,
      1,
      createdAt,
      createdAt,
    ]);
    expect(query.mock.calls[2]?.[1]).toEqual([
      order.id,
      [1],
      [productId],
      ['TECLADO'],
      ['Teclado'],
      ['20000'],
      [2],
      ['40000'],
      [4],
      [createdAt],
    ]);
    expect(query.mock.calls.some(([statement]) => statement === 'ROLLBACK')).toBe(false);
    expect(client.listenerCount('error')).toBe(0);
    expect(client.release).toHaveBeenCalledOnce();
  });

  it('rejects inconsistent aggregates before acquiring a connection', async () => {
    const { repository, pool } = fakeRepository(() => ({ rows: [], rowCount: null }));
    const order = { ...orderFixture(), totalCents: 1n };

    await expect(repository.create(order, correlationId)).rejects.toThrow(
      'Order aggregate invariants are inconsistent.',
    );
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it('rolls back when the item batch does not insert every requested line', async () => {
    const { repository, query, client } = fakeRepository((statement) => ({
      rows: [],
      rowCount: statement.includes('INSERT INTO order_items') ? 0 : null,
    }));
    const log = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    await expect(repository.create(orderFixture(), correlationId)).rejects.toThrow(
      'PostgreSQL did not insert every order item.',
    );
    expect(query).toHaveBeenCalledWith('ROLLBACK');
    expect(query).not.toHaveBeenCalledWith('COMMIT');
    expect(client.release).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalled();
  });

  it('logs rollback failures while preserving the original persistence error', async () => {
    const { repository, query } = fakeRepository((statement) => {
      if (statement.includes('INSERT INTO order_items')) return { rows: [], rowCount: 0 };
      if (statement === 'ROLLBACK') throw new Error('connection already closed');
      return { rows: [], rowCount: null };
    });
    const log = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    await expect(repository.create(orderFixture(), correlationId)).rejects.toThrow(
      'PostgreSQL did not insert every order item.',
    );
    expect(query).toHaveBeenCalledWith('ROLLBACK');
    expect(log).toHaveBeenCalledWith(`Rollback failed traceId=${correlationId}`);
  });

  it('returns null for a missing order and reconstructs a persisted snapshot', async () => {
    const order = orderFixture();
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [databaseRow(order) as QueryResultRow], rowCount: 1 })
        .mockResolvedValueOnce({
          rows: [{ ...databaseRow(order), product_updated_at: createdAt } as QueryResultRow],
          rowCount: 1,
        }),
      connect: vi.fn(),
    };
    const repository = new PostgresOrderRepository(pool as never);

    await expect(repository.findById(order.id)).resolves.toBeNull();
    await expect(repository.findById(order.id)).resolves.toEqual(order);
    await expect(repository.findById(order.id)).resolves.toEqual(order);
    expect(pool.query).toHaveBeenNthCalledWith(1, expect.stringContaining('WHERE o.id = $1'), [
      order.id,
    ]);
  });

  it('rejects corrupt rows and wraps transient read failures', async () => {
    const order = orderFixture();
    const corruptRow = { ...databaseRow(order), item_count: 2 } as QueryResultRow;
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [corruptRow], rowCount: 1 })
        .mockRejectedValueOnce(Object.assign(new Error('unavailable'), { code: 'ECONNREFUSED' })),
      connect: vi.fn(),
    };
    const repository = new PostgresOrderRepository(pool as never);
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    await expect(repository.findById(order.id)).rejects.toThrow(
      'Stored order aggregate is inconsistent.',
    );
    await expect(repository.findById(order.id)).rejects.toMatchObject({
      status: 503,
      code: 'PERSISTENCE_UNAVAILABLE',
    });
  });

  it('rejects empty result sets, incorrect item sequence, and mismatched subtotals', async () => {
    const order = orderFixture();
    const validRow = databaseRow(order) as QueryResultRow;
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ ...validRow, line_number: 2 }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ ...validRow, subtotal_cents: '39999' }], rowCount: 1 }),
      connect: vi.fn(),
    };
    const repository = new PostgresOrderRepository(pool as never);
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    await expect(repository.findById(order.id)).rejects.toThrow('Order rows are empty.');
    await expect(repository.findById(order.id)).rejects.toThrow(
      'Stored order aggregate is inconsistent.',
    );
    await expect(repository.findById(order.id)).rejects.toThrow(
      'Stored order aggregate is inconsistent.',
    );
  });

  it('rejects invalid timestamps from PostgreSQL instead of returning malformed JSON', async () => {
    const order = orderFixture();
    const invalidRow = {
      ...databaseRow(order),
      product_updated_at: new Date('invalid'),
    } as QueryResultRow;
    const pool = {
      query: vi.fn(async () => ({ rows: [invalidRow], rowCount: 1 })),
      connect: vi.fn(),
    };
    const repository = new PostgresOrderRepository(pool as never);
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    await expect(repository.findById(order.id)).rejects.toThrow(
      'PostgreSQL returned an invalid timestamp.',
    );
  });

  it('lists summaries in a repeatable-read transaction and handles an empty page', async () => {
    const summary = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      customer_name: 'Cliente',
      customer_email: 'cliente@example.com',
      currency: 'BRL',
      subtotal_cents: '40000',
      discount_amount_cents: '0',
      total_cents: '40000',
      item_count: 1,
      created_at: new Date(createdAt),
    };
    const { repository, query, client } = fakeRepository((statement) => {
      if (statement.includes('count(*)')) return { rows: [{ total: '1' }], rowCount: 1 };
      if (statement.includes('ORDER BY created_at')) return { rows: [summary], rowCount: 1 };
      return { rows: [], rowCount: null };
    });

    await expect(repository.list(2, 10)).resolves.toEqual({
      data: [
        {
          id: summary.id,
          customer: { name: 'Cliente', email: 'cliente@example.com' },
          currency: 'BRL',
          subtotalCents: 40_000n,
          discountAmountCents: 0n,
          totalCents: 40_000n,
          status: 'CREATED',
          itemCount: 1,
          createdAt,
        },
      ],
      meta: { page: 2, pageSize: 10, totalItems: 1, totalPages: 1 },
    });
    expect(query.mock.calls.map(([statement]) => statement)).toEqual([
      'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY',
      'SELECT count(*)::text AS total FROM orders',
      expect.stringContaining('ORDER BY created_at DESC, id DESC'),
      'COMMIT',
    ]);
    expect(query.mock.calls[2]?.[1]).toEqual([10, 10]);
    expect(client.release).toHaveBeenCalledOnce();
  });

  it('returns zero pages for an empty list', async () => {
    const { repository } = fakeRepository((statement) =>
      statement.includes('count(*)')
        ? { rows: [{ total: '0' }], rowCount: 1 }
        : { rows: [], rowCount: 0 },
    );

    await expect(repository.list(5, 20)).resolves.toEqual({
      data: [],
      meta: { page: 5, pageSize: 20, totalItems: 0, totalPages: 0 },
    });
  });

  it('rolls back on invalid counts and maps connection errors from reads and readiness', async () => {
    const unavailable = Object.assign(new Error('offline'), { code: 'ECONNREFUSED' });
    const connection = fakeClient((statement) => {
      if (statement.includes('count(*)'))
        return { rows: [{ total: '9007199254740992' }], rowCount: 1 };
      if (statement === 'SELECT 1') throw unavailable;
      return { rows: [], rowCount: null };
    });
    const pool = {
      connect: vi.fn(async () => connection.client),
      query: vi.fn(async (statement: string) => {
        if (statement === 'SELECT 1') throw unavailable;
        return { rows: [], rowCount: null };
      }),
    };
    const repository = new PostgresOrderRepository(pool as never);
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    await expect(repository.list(1, 20)).rejects.toThrow(
      'Order count exceeds the safe integer range.',
    );
    expect(connection.query).toHaveBeenCalledWith('ROLLBACK');
    expect(connection.client.release).toHaveBeenCalledOnce();
    await expect(repository.checkReady()).rejects.toMatchObject({
      status: 503,
      code: 'PERSISTENCE_UNAVAILABLE',
    });
  });

  it('classifies connection failures before starting list transactions and propagates other errors', async () => {
    const unavailable = Object.assign(new Error('database offline'), { code: 'ECONNREFUSED' });
    const unexpected = new Error('unexpected');
    const pool = {
      connect: vi.fn().mockRejectedValueOnce(unavailable).mockRejectedValueOnce(unexpected),
      query: vi.fn(),
    };
    const repository = new PostgresOrderRepository(pool as never);

    await expect(repository.list(1, 20)).rejects.toMatchObject({
      status: 503,
      code: 'PERSISTENCE_UNAVAILABLE',
    });
    await expect(repository.list(1, 20)).rejects.toBe(unexpected);
    expect(pool.query).not.toHaveBeenCalled();
  });
});
