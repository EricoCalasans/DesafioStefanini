import type { DiscountPolicy } from '../bootstrap/configuration.js';
import { calculateDiscount, calculateLineSubtotal, calculateSubtotal } from './money.js';

export interface Customer {
  readonly name: string;
  readonly email: string;
}

export interface RequestedOrderItem {
  readonly productId: string;
  readonly quantity: number;
}

export interface CatalogProduct {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly currency: 'BRL';
  readonly priceCents: bigint;
  readonly active: boolean;
  readonly priceVersion: number;
  readonly updatedAt: string;
}

export interface OrderItem {
  readonly lineNumber: number;
  readonly productId: string;
  readonly sku: string;
  readonly productName: string;
  readonly unitPriceCents: bigint;
  readonly quantity: number;
  readonly lineSubtotalCents: bigint;
  readonly priceVersion: number;
  readonly productUpdatedAt: string;
}

export interface Order {
  readonly id: string;
  readonly customer: Customer;
  readonly items: readonly OrderItem[];
  readonly currency: 'BRL';
  readonly subtotalCents: bigint;
  readonly discount: {
    readonly applied: boolean;
    readonly amountCents: bigint;
    readonly policy: DiscountPolicy;
  };
  readonly totalCents: bigint;
  readonly status: 'CREATED';
  readonly pricingObservedAt: string;
  readonly createdAt: string;
}

export function createOrder(input: {
  readonly id: string;
  readonly customer: Customer;
  readonly requestedItems: readonly RequestedOrderItem[];
  readonly products: readonly CatalogProduct[];
  readonly policy: DiscountPolicy;
  readonly pricingObservedAt: string;
  readonly createdAt: string;
}): Order {
  const productsById = new Map(input.products.map((product) => [product.id, product]));
  const items = input.requestedItems.map((requested, index): OrderItem => {
    const product = productsById.get(requested.productId);
    if (!product?.active) {
      throw new Error('Only validated active catalog products can be ordered.');
    }
    const lineSubtotalCents = calculateLineSubtotal(product.priceCents, requested.quantity);
    return {
      lineNumber: index + 1,
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      unitPriceCents: product.priceCents,
      quantity: requested.quantity,
      lineSubtotalCents,
      priceVersion: product.priceVersion,
      productUpdatedAt: product.updatedAt,
    };
  });
  const subtotalCents = calculateSubtotal(items.map((item) => item.lineSubtotalCents));
  const calculatedDiscount = calculateDiscount(subtotalCents, input.policy);

  return {
    id: input.id,
    customer: input.customer,
    items,
    currency: 'BRL',
    subtotalCents,
    discount: {
      ...calculatedDiscount,
      policy: input.policy,
    },
    totalCents: subtotalCents - calculatedDiscount.amountCents,
    status: 'CREATED',
    pricingObservedAt: input.pricingObservedAt,
    createdAt: input.createdAt,
  };
}
