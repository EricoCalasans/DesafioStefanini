import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Pool, PoolClient, QueryResultRow } from 'pg';
import { ApplicationError } from '../application/errors.js';
import type { OrderPage, OrderRepository } from '../application/ports.js';
import { ORDER_REPOSITORY } from '../application/ports.js';
import type { Order, OrderItem } from '../domain/order.js';

const POOL = Symbol('ORDERS_POSTGRES_POOL');

class PersistenceUnavailable extends ApplicationError {
  constructor() {
    super(
      503,
      'PERSISTENCE_UNAVAILABLE',
      'Banco indisponível',
      'Não foi possível acessar os pedidos neste momento.',
    );
    this.name = 'PersistenceUnavailable';
  }
}

function asBigInt(value: string | number | bigint): bigint {
  return BigInt(value);
}

function asDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime()))
    throw new Error('PostgreSQL returned an invalid timestamp.');
  return date.toISOString();
}

interface OrderRow extends QueryResultRow {
  id: string;
  customer_name: string;
  customer_email: string;
  currency: 'BRL';
  subtotal_cents: string;
  discount_amount_cents: string;
  total_cents: string;
  discount_enabled: boolean;
  discount_rule_id: string;
  discount_threshold_cents: string;
  discount_rate_bps: number;
  discount_rounding: 'HALF_UP';
  item_count: number;
  pricing_observed_at: Date;
  created_at: Date;
  line_number: number;
  product_id: string;
  product_sku: string;
  product_name: string;
  unit_price_cents: string;
  quantity: number;
  line_subtotal_cents: string;
  product_price_version: number;
  product_updated_at: Date;
}

@Injectable()
export class PostgresOrderRepository implements OrderRepository {
  private readonly logger = new Logger(PostgresOrderRepository.name);

  constructor(@Inject(POOL) private readonly pool: Pool) {}

  async create(order: Order, correlationId: string): Promise<Order> {
    this.assertOrderIntegrity(order);
    let client: PoolClient | undefined;
    let transactionStarted = false;
    try {
      client = await this.pool.connect();
      await client.query('BEGIN');
      transactionStarted = true;
      await client.query(
        `INSERT INTO orders (
          id, customer_name, customer_email, currency, subtotal_cents, discount_amount_cents,
          total_cents, discount_enabled, discount_rule_id, discount_threshold_cents,
          discount_rate_bps, discount_rounding, item_count, pricing_observed_at, created_at
        ) VALUES ($1, $2, $3, 'BRL', $4, $5, $6, $7, $8, $9, $10, 'HALF_UP', $11, $12, $13)`,
        [
          order.id,
          order.customer.name,
          order.customer.email,
          order.subtotalCents.toString(),
          order.discount.amountCents.toString(),
          order.totalCents.toString(),
          order.discount.policy.enabled,
          order.discount.policy.ruleId,
          order.discount.policy.thresholdCents.toString(),
          order.discount.policy.rateBps,
          order.items.length,
          order.pricingObservedAt,
          order.createdAt,
        ],
      );

      const itemResult = await client.query(
        `INSERT INTO order_items (
          order_id, line_number, product_id, product_sku, product_name, unit_price_cents,
          quantity, line_subtotal_cents, product_price_version, product_updated_at
        )
        SELECT $1, item.line_number, item.product_id, item.product_sku, item.product_name,
          item.unit_price_cents, item.quantity, item.line_subtotal_cents,
          item.product_price_version, item.product_updated_at
        FROM UNNEST(
          $2::integer[], $3::uuid[], $4::text[], $5::text[], $6::bigint[],
          $7::integer[], $8::bigint[], $9::integer[], $10::timestamptz[]
        ) AS item(line_number, product_id, product_sku, product_name, unit_price_cents,
          quantity, line_subtotal_cents, product_price_version, product_updated_at)`,
        [
          order.id,
          order.items.map((item) => item.lineNumber),
          order.items.map((item) => item.productId),
          order.items.map((item) => item.sku),
          order.items.map((item) => item.productName),
          order.items.map((item) => item.unitPriceCents.toString()),
          order.items.map((item) => item.quantity),
          order.items.map((item) => item.lineSubtotalCents.toString()),
          order.items.map((item) => item.priceVersion),
          order.items.map((item) => item.productUpdatedAt),
        ],
      );
      if (itemResult.rowCount !== order.items.length) {
        throw new Error('PostgreSQL did not insert every order item.');
      }
      await client.query('COMMIT');
      transactionStarted = false;
      return order;
    } catch (error) {
      if (transactionStarted && client) {
        try {
          await client.query('ROLLBACK');
        } catch {
          this.logger.error(`Rollback failed traceId=${correlationId}`);
        }
      }
      this.logger.error(
        `Order persistence failed errorType=${error instanceof Error ? error.name : typeof error} traceId=${correlationId}`,
      );
      throw new PersistenceUnavailable();
    } finally {
      client?.release();
    }
  }

  async findById(id: string): Promise<Order | null> {
    try {
      const result = await this.pool.query<OrderRow>(
        `SELECT o.*, i.line_number, i.product_id, i.product_sku, i.product_name,
          i.unit_price_cents, i.quantity, i.line_subtotal_cents, i.product_price_version, i.product_updated_at
         FROM orders o JOIN order_items i ON i.order_id = o.id
         WHERE o.id = $1 ORDER BY i.line_number ASC`,
        [id],
      );
      if (result.rowCount === 0) return null;
      return this.mapOrder(result.rows);
    } catch (error) {
      this.logger.error(
        `Order read failed errorType=${error instanceof Error ? error.name : typeof error}`,
      );
      throw new PersistenceUnavailable();
    }
  }

  async list(page: number, pageSize: number): Promise<OrderPage> {
    const client = await this.pool.connect().catch(() => {
      throw new PersistenceUnavailable();
    });
    try {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const count = await client.query<{ total: string }>(
        'SELECT count(*)::text AS total FROM orders',
      );
      const totalItems = Number(count.rows[0]?.total ?? '0');
      if (!Number.isSafeInteger(totalItems)) {
        throw new Error('Order count exceeds the safe integer range.');
      }
      const result = await client.query<OrderRow>(
        `SELECT id, customer_name, customer_email, currency, subtotal_cents, discount_amount_cents,
          total_cents, item_count, created_at FROM orders
         ORDER BY created_at DESC, id DESC LIMIT $1 OFFSET $2`,
        [pageSize, (page - 1) * pageSize],
      );
      await client.query('COMMIT');
      return {
        data: result.rows.map((row) => ({
          id: row.id,
          customer: { name: row.customer_name, email: row.customer_email },
          currency: 'BRL',
          subtotalCents: asBigInt(row.subtotal_cents),
          discountAmountCents: asBigInt(row.discount_amount_cents),
          totalCents: asBigInt(row.total_cents),
          status: 'CREATED',
          itemCount: row.item_count,
          createdAt: asDate(row.created_at),
        })),
        meta: {
          page,
          pageSize,
          totalItems,
          totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize),
        },
      };
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch {
        /* connection may already be lost */
      }
      this.logger.error(
        `Order list failed errorType=${error instanceof Error ? error.name : typeof error}`,
      );
      throw new PersistenceUnavailable();
    } finally {
      client.release();
    }
  }

  async checkReady(): Promise<void> {
    try {
      await this.pool.query('SELECT 1');
    } catch {
      throw new PersistenceUnavailable();
    }
  }

  private mapOrder(rows: readonly OrderRow[]): Order {
    const first = rows[0];
    if (!first) throw new Error('Order rows are empty.');
    const items: OrderItem[] = rows.map((row) => ({
      lineNumber: row.line_number,
      productId: row.product_id,
      sku: row.product_sku,
      productName: row.product_name,
      unitPriceCents: asBigInt(row.unit_price_cents),
      quantity: row.quantity,
      lineSubtotalCents: asBigInt(row.line_subtotal_cents),
      priceVersion: row.product_price_version,
      productUpdatedAt: asDate(row.product_updated_at),
    }));
    if (
      items.length !== first.item_count ||
      items.some((item, index) => item.lineNumber !== index + 1) ||
      items.reduce((sum, item) => sum + item.lineSubtotalCents, 0n) !==
        asBigInt(first.subtotal_cents)
    ) {
      throw new Error('Stored order aggregate is inconsistent.');
    }
    return {
      id: first.id,
      customer: { name: first.customer_name, email: first.customer_email },
      items,
      currency: 'BRL',
      subtotalCents: asBigInt(first.subtotal_cents),
      discount: {
        applied: asBigInt(first.discount_amount_cents) > 0n,
        amountCents: asBigInt(first.discount_amount_cents),
        policy: {
          ruleId: first.discount_rule_id,
          enabled: first.discount_enabled,
          thresholdCents: asBigInt(first.discount_threshold_cents),
          rateBps: first.discount_rate_bps,
          rounding: 'HALF_UP',
        },
      },
      totalCents: asBigInt(first.total_cents),
      status: 'CREATED',
      pricingObservedAt: asDate(first.pricing_observed_at),
      createdAt: asDate(first.created_at),
    };
  }

  private assertOrderIntegrity(order: Order): void {
    const productIds = new Set(order.items.map((item) => item.productId));
    if (
      order.items.length < 1 ||
      order.items.length > 100 ||
      productIds.size !== order.items.length ||
      order.items.some(
        (item, index) =>
          item.lineNumber !== index + 1 ||
          item.unitPriceCents < 1n ||
          item.unitPriceCents > 100_000_000n ||
          item.quantity < 1 ||
          item.quantity > 10_000 ||
          item.lineSubtotalCents !== item.unitPriceCents * BigInt(item.quantity),
      ) ||
      order.items.reduce((sum, item) => sum + item.lineSubtotalCents, 0n) !== order.subtotalCents ||
      order.subtotalCents > 1_000_000_000_000n ||
      order.totalCents !== order.subtotalCents - order.discount.amountCents ||
      order.discount.amountCents < 0n ||
      order.discount.amountCents > order.subtotalCents
    ) {
      throw new Error('Order aggregate invariants are inconsistent.');
    }
  }
}

export { ORDER_REPOSITORY, POOL };
