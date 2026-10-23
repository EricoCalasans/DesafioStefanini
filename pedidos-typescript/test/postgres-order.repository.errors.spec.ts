import { EventEmitter } from 'node:events';
import { Logger } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PostgresOrderRepository } from '../src/adapters/postgres-order.repository.js';
import { createOrder, type Order } from '../src/domain/order.js';

const correlationId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const order: Order = createOrder({
  id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  customer: { name: 'QA Client', email: 'qa@example.test' },
  requestedItems: [{ productId: '11111111-1111-4111-8111-111111111111', quantity: 2 }],
  products: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      sku: 'TEST-001',
      name: 'Test product',
      currency: 'BRL',
      priceCents: 1_000n,
      active: true,
      priceVersion: 1,
      updatedAt: '2026-10-22T12:00:00.000Z',
    },
  ],
  policy: {
    ruleId: 'qa-v1',
    enabled: false,
    thresholdCents: 0n,
    rateBps: 0,
    rounding: 'HALF_UP',
  },
  pricingObservedAt: '2026-10-22T12:00:00.000Z',
  createdAt: '2026-10-22T12:00:00.000Z',
});

function makeError(code: string): Error {
  return Object.assign(new Error('synthetic database error'), { code });
}

function makeRepository(error: Error, phase: 'connect' | 'items' | 'commit') {
  const client = new EventEmitter() as EventEmitter & {
    query: (statement: string) => Promise<{ rows: unknown[]; rowCount: number | null }>;
    release: () => void;
  };
  const query = vi.fn(async (statement: string) => {
    if (phase === 'items' && statement.includes('INSERT INTO order_items')) throw error;
    if (phase === 'commit' && statement === 'COMMIT') {
      client.emit('error', error);
      throw error;
    }
    return { rows: [], rowCount: statement.startsWith('INSERT INTO order_items') ? 1 : null };
  });
  client.query = query;
  client.release = vi.fn();
  const pool = {
    connect: vi.fn(async () => {
      if (phase === 'connect') throw error;
      return client;
    }),
  };
  return { repository: new PostgresOrderRepository(pool as never), query, client };
}

describe('PostgresOrderRepository error classification', () => {
  it('propagates unexpected SQL failures after rolling back', async () => {
    const error = makeError('P0001');
    const { repository, query } = makeRepository(error, 'items');

    await expect(repository.create(order, correlationId)).rejects.toBe(error);
    expect(query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('maps lock timeouts to a sanitized persistence error after rolling back', async () => {
    const { repository, query } = makeRepository(makeError('55P03'), 'items');

    await expect(repository.create(order, correlationId)).rejects.toMatchObject({
      status: 503,
      code: 'PERSISTENCE_UNAVAILABLE',
      detail: 'Não foi possível acessar os pedidos neste momento.',
    });
    expect(query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('maps connection failures before starting a transaction', async () => {
    const { repository, query } = makeRepository(makeError('ECONNREFUSED'), 'connect');

    await expect(repository.create(order, correlationId)).rejects.toMatchObject({
      status: 503,
      code: 'PERSISTENCE_UNAVAILABLE',
    });
    expect(query).not.toHaveBeenCalled();
  });

  it('logs an ambiguous commit without retrying or issuing a misleading rollback', async () => {
    const { repository, query, client } = makeRepository(makeError('ECONNRESET'), 'commit');
    const log = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    try {
      await expect(repository.create(order, correlationId)).rejects.toMatchObject({
        status: 503,
        code: 'PERSISTENCE_UNAVAILABLE',
      });
      expect(query).toHaveBeenCalledWith('COMMIT');
      expect(query).not.toHaveBeenCalledWith('ROLLBACK');
      expect(query.mock.calls.filter(([statement]) => statement === 'COMMIT')).toHaveLength(1);
      expect(log).toHaveBeenCalledWith(
        expect.stringContaining('Order commit outcome ambiguous retry=false'),
      );
      expect(client.listenerCount('error')).toBe(0);
    } finally {
      log.mockRestore();
    }
  });
});
