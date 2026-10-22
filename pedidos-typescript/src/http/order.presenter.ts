import type { OrderPage } from '../application/ports.js';
import { toSafeInteger } from '../domain/money.js';
import type { Order } from '../domain/order.js';

export function presentOrder(order: Order) {
  return {
    id: order.id,
    customer: order.customer,
    items: order.items.map((item) => ({
      lineNumber: item.lineNumber,
      productId: item.productId,
      sku: item.sku,
      productName: item.productName,
      unitPriceCents: toSafeInteger(item.unitPriceCents, 'unitPriceCents'),
      quantity: item.quantity,
      lineSubtotalCents: toSafeInteger(item.lineSubtotalCents, 'lineSubtotalCents'),
      priceVersion: item.priceVersion,
      productUpdatedAt: item.productUpdatedAt,
    })),
    currency: order.currency,
    subtotalCents: toSafeInteger(order.subtotalCents, 'subtotalCents'),
    discount: {
      applied: order.discount.applied,
      amountCents: toSafeInteger(order.discount.amountCents, 'discount.amountCents'),
      policy: {
        ...order.discount.policy,
        thresholdCents: toSafeInteger(
          order.discount.policy.thresholdCents,
          'discount.thresholdCents',
        ),
      },
    },
    totalCents: toSafeInteger(order.totalCents, 'totalCents'),
    status: order.status,
    pricingObservedAt: order.pricingObservedAt,
    createdAt: order.createdAt,
  };
}

export function presentOrderPage(page: OrderPage) {
  return {
    data: page.data.map((order) => ({
      id: order.id,
      customer: order.customer,
      currency: order.currency,
      subtotalCents: toSafeInteger(order.subtotalCents, 'subtotalCents'),
      discountAmountCents: toSafeInteger(order.discountAmountCents, 'discountAmountCents'),
      totalCents: toSafeInteger(order.totalCents, 'totalCents'),
      status: order.status,
      itemCount: order.itemCount,
      createdAt: order.createdAt,
    })),
    meta: page.meta,
  };
}
