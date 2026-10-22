import { Pool } from 'pg';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { PostgresOrderRepository } from '../../src/adapters/postgres-order.repository.js';
import { CreateOrderUseCase } from '../../src/application/create-order.js';
import type { CatalogProduct, Order } from '../../src/domain/order.js';

const productId = '11111111-1111-4111-8111-111111111111';
const observedAt = '2026-10-22T12:00:00.000Z';
const correlationId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const TRIGGER_NAME = 'orders_test_fail_item_insert';
const FUNCTION_NAME = 'orders_test_reject_item_insert';

function requiredTestDatabaseUrl(): string {
  const value = process.env.ORDERS_TEST_DATABASE_URL;
  if (!value)
    throw new Error('ORDERS_TEST_DATABASE_URL is required; never use the demonstration database.');
  const url = new URL(value);
  if (url.pathname !== '/orders_test') {
    throw new Error('Integration tests are restricted to a database named orders_test.');
  }
  if (value === process.env.ORDERS_DATABASE_URL) {
    throw new Error('ORDERS_TEST_DATABASE_URL must be separate from ORDERS_DATABASE_URL.');
  }
  return value;
}

function createOrder(
  id: string,
  customerName = 'Integration Client',
  options: {
    priceCents?: bigint;
    priceVersion?: number;
    updatedAt?: string;
    quantity?: number;
    policy?: {
      ruleId: string;
      thresholdCents: bigint;
      rateBps: number;
    };
  } = {},
): Promise<Order> {
  const product: CatalogProduct = {
    id: productId,
    sku: 'TEST-001',
    name: 'Integration Product',
    currency: 'BRL',
    priceCents: options.priceCents ?? 20_000n,
    active: true,
    priceVersion: options.priceVersion ?? 1,
    updatedAt: options.updatedAt ?? observedAt,
  };
  const useCase = new CreateOrderUseCase({
    catalog: {
      queryProducts: async () => ({ products: [product], missingProductIds: [], observedAt }),
    },
    repository,
    policy: {
      ruleId: options.policy?.ruleId ?? 'integration-v1',
      enabled: true,
      thresholdCents: options.policy?.thresholdCents ?? 50_000n,
      rateBps: options.policy?.rateBps ?? 1_000,
      rounding: 'HALF_UP',
    },
    clock: { now: () => new Date(observedAt) },
    uuidGenerator: { generate: () => id },
  });
  return useCase.execute({
    customer: { name: customerName, email: 'integration@example.com' },
    items: [{ productId, quantity: options.quantity ?? 1 }],
    correlationId,
  });
}

let runtimePool: Pool;
let migrationPool: Pool;
let repository: PostgresOrderRepository;

describe('PostgresOrderRepository against isolated PostgreSQL', () => {
  beforeAll(async () => {
    const runtimeUrl = requiredTestDatabaseUrl();
    const migrationUrl = process.env.ORDERS_TEST_MIGRATION_DATABASE_URL;
    if (!migrationUrl || new URL(migrationUrl).pathname !== '/orders_test') {
      throw new Error(
        'ORDERS_TEST_MIGRATION_DATABASE_URL must point to the isolated orders_test database.',
      );
    }
    runtimePool = new Pool({
      connectionString: runtimeUrl,
      max: 3,
      connectionTimeoutMillis: 1_000,
      options: '-c statement_timeout=2000 -c lock_timeout=1000',
    });
    migrationPool = new Pool({
      connectionString: migrationUrl,
      max: 1,
      connectionTimeoutMillis: 1_000,
    });
    repository = new PostgresOrderRepository(runtimePool as never);
    await runtimePool.query('SELECT 1');
    const schema = await runtimePool.query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('orders', 'order_items')",
    );
    expect(schema.rows.map((row) => row.table_name).sort()).toEqual(['order_items', 'orders']);
  });

  afterEach(async () => {
    await migrationPool.query('DELETE FROM orders');
  });

  afterAll(async () => {
    if (migrationPool) {
      await migrationPool.query(`DROP TRIGGER IF EXISTS ${TRIGGER_NAME} ON order_items`);
      await migrationPool.query(`DROP FUNCTION IF EXISTS ${FUNCTION_NAME}()`);
      await migrationPool.end();
    }
    if (runtimePool) await runtimePool.end();
  });

  it('persists and reconstructs the complete immutable snapshot using parameterized values', async () => {
    const sqlLikeName = "D'Angelo); DROP TABLE orders;--";
    const created = await createOrder('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', sqlLikeName);
    const loaded = await repository.findById(created.id);
    expect(loaded).toEqual(created);
    expect(loaded?.customer.name).toBe(sqlLikeName);
    expect(await runtimePool.query('SELECT count(*)::integer AS count FROM orders')).toMatchObject({
      rows: [{ count: 1 }],
    });
  });

  it('keeps old price and discount snapshots when the catalog and policy change', async () => {
    const original = await createOrder('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Original', {
      quantity: 3,
    });
    const revised = await createOrder('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Revised', {
      priceCents: 30_000n,
      priceVersion: 2,
      updatedAt: '2026-10-23T12:00:00.000Z',
      quantity: 3,
      policy: { ruleId: 'integration-v2', thresholdCents: 50_000n, rateBps: 2_000 },
    });

    const originalSnapshot = await repository.findById(original.id);
    const revisedSnapshot = await repository.findById(revised.id);
    expect(original.subtotalCents).toBe(60_000n);
    expect(original.discount.amountCents).toBe(6_000n);
    expect(original.totalCents).toBe(54_000n);
    expect(originalSnapshot?.items[0]).toMatchObject({
      unitPriceCents: 20_000n,
      priceVersion: 1,
    });
    expect(originalSnapshot?.discount.policy).toMatchObject({
      ruleId: 'integration-v1',
      rateBps: 1_000,
    });
    expect(revised.subtotalCents).toBe(90_000n);
    expect(revised.discount.amountCents).toBe(18_000n);
    expect(revised.totalCents).toBe(72_000n);
    expect(revisedSnapshot?.items[0]).toMatchObject({
      unitPriceCents: 30_000n,
      priceVersion: 2,
    });
    expect(revisedSnapshot?.discount.policy).toMatchObject({
      ruleId: 'integration-v2',
      rateBps: 2_000,
    });
    expect(originalSnapshot).toEqual(original);
  });

  it('keeps the runtime database role read/insert-only and away from migration metadata', async () => {
    const result = await runtimePool.query<{
      can_update_orders: boolean;
      can_delete_orders: boolean;
      can_create_objects: boolean;
      can_read_migrations: boolean;
    }>(`SELECT
      has_table_privilege(current_user, 'orders', 'UPDATE') AS can_update_orders,
      has_table_privilege(current_user, 'orders', 'DELETE') AS can_delete_orders,
      has_schema_privilege(current_user, 'public', 'CREATE') AS can_create_objects,
      has_table_privilege(current_user, 'schema_migrations', 'SELECT') AS can_read_migrations`);
    expect(result.rows[0]).toEqual({
      can_update_orders: false,
      can_delete_orders: false,
      can_create_objects: false,
      can_read_migrations: false,
    });
  });

  it('returns deterministic pages from one transaction snapshot', async () => {
    await createOrder('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    await createOrder('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');

    const firstPage = await repository.list(1, 1);
    const secondPage = await repository.list(2, 1);
    expect(firstPage.data.map((order) => order.id)).toEqual([
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    ]);
    expect(secondPage.data.map((order) => order.id)).toEqual([
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    ]);
    expect(firstPage.meta).toEqual({ page: 1, pageSize: 1, totalItems: 2, totalPages: 2 });
  });

  it('rolls back the header when the batched item insert fails in PostgreSQL', async () => {
    await migrationPool.query(`CREATE OR REPLACE FUNCTION ${FUNCTION_NAME}() RETURNS trigger
      LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'orders integration forced item failure'; END; $$`);
    await migrationPool.query(`CREATE TRIGGER ${TRIGGER_NAME} BEFORE INSERT ON order_items
      FOR EACH ROW EXECUTE FUNCTION ${FUNCTION_NAME}()`);

    await expect(createOrder('cccccccc-cccc-4ccc-8ccc-cccccccccccc')).rejects.toMatchObject({
      status: 503,
      code: 'PERSISTENCE_UNAVAILABLE',
    });
    const result = await runtimePool.query<{ count: number }>(
      'SELECT count(*)::integer AS count FROM orders WHERE id = $1',
      ['cccccccc-cccc-4ccc-8ccc-cccccccccccc'],
    );
    expect(result.rows[0]?.count).toBe(0);
  });
});
