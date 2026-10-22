import type { DiscountPolicy } from '../bootstrap/configuration.js';
import type { CatalogProduct, Customer, Order } from '../domain/order.js';

export const ORDERS_CONFIGURATION = Symbol('ORDERS_CONFIGURATION');
export const ORDER_REPOSITORY = Symbol('ORDER_REPOSITORY');
export const CATALOG_CLIENT = Symbol('CATALOG_CLIENT');
export const CLOCK = Symbol('CLOCK');
export const UUID_GENERATOR = Symbol('UUID_GENERATOR');
export const CREATE_ORDER_USE_CASE = Symbol('CREATE_ORDER_USE_CASE');

export interface CatalogBatchResult {
  readonly products: readonly CatalogProduct[];
  readonly missingProductIds: readonly string[];
  readonly observedAt: string;
}

export interface CatalogClient {
  queryProducts(productIds: readonly string[], correlationId: string): Promise<CatalogBatchResult>;
}

export interface OrderSummary {
  readonly id: string;
  readonly customer: Customer;
  readonly currency: 'BRL';
  readonly subtotalCents: bigint;
  readonly discountAmountCents: bigint;
  readonly totalCents: bigint;
  readonly status: 'CREATED';
  readonly itemCount: number;
  readonly createdAt: string;
}

export interface OrderPage {
  readonly data: readonly OrderSummary[];
  readonly meta: {
    readonly page: number;
    readonly pageSize: number;
    readonly totalItems: number;
    readonly totalPages: number;
  };
}

export interface OrderRepository {
  create(order: Order, correlationId: string): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  list(page: number, pageSize: number): Promise<OrderPage>;
  checkReady(): Promise<void>;
}

export interface Clock {
  now(): Date;
}

export interface UuidGenerator {
  generate(): string;
}

export interface CreateOrderInput {
  readonly customer: Customer;
  readonly items: readonly { readonly productId: string; readonly quantity: number }[];
  readonly correlationId: string;
}

export interface CreateOrderDependencies {
  readonly catalog: CatalogClient;
  readonly repository: OrderRepository;
  readonly policy: DiscountPolicy;
  readonly clock: Clock;
  readonly uuidGenerator: UuidGenerator;
}

export type { CatalogProduct, Order };
