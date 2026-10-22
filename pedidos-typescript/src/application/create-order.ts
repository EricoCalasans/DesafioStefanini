import { createOrder, type Order } from '../domain/order.js';
import { ApplicationError } from './errors.js';
import type { CreateOrderDependencies, CreateOrderInput } from './ports.js';

export class CreateOrderUseCase {
  constructor(private readonly dependencies: CreateOrderDependencies) {}

  async execute(input: CreateOrderInput) {
    const productIds = input.items.map((item) => item.productId);
    const seen = new Set<string>();
    const duplicateIds = new Set<string>();
    for (const id of productIds) {
      if (seen.has(id)) duplicateIds.add(id);
      seen.add(id);
    }
    if (duplicateIds.size > 0) {
      throw new ApplicationError(
        422,
        'DUPLICATE_PRODUCT_IDS',
        'Produtos repetidos',
        'Cada produto deve aparecer uma única vez no pedido.',
        [...duplicateIds].sort().map((productId) => ({
          field: 'items',
          code: 'DUPLICATE_PRODUCT_ID',
          message: 'O produto aparece mais de uma vez.',
          productId,
        })),
      );
    }

    const catalogResult = await this.dependencies.catalog.queryProducts(
      productIds,
      input.correlationId,
    );
    const byId = new Map(catalogResult.products.map((product) => [product.id, product]));
    const notOrderable = input.items.flatMap((item, index) => {
      if (catalogResult.missingProductIds.includes(item.productId)) {
        return [
          {
            field: `items[${index}].productId`,
            code: 'PRODUCT_NOT_FOUND',
            message: 'O produto não existe.',
            productId: item.productId,
          },
        ];
      }
      const product = byId.get(item.productId);
      return product && !product.active
        ? [
            {
              field: `items[${index}].productId`,
              code: 'PRODUCT_INACTIVE',
              message: 'O produto está inativo.',
              productId: item.productId,
            },
          ]
        : [];
    });
    if (notOrderable.length > 0) {
      throw new ApplicationError(
        422,
        'PRODUCTS_NOT_ORDERABLE',
        'Produtos indisponíveis',
        'Um ou mais produtos não podem ser incluídos no pedido.',
        notOrderable,
      );
    }

    const now = this.dependencies.clock.now().toISOString();
    let order: Order;
    try {
      order = createOrder({
        id: this.dependencies.uuidGenerator.generate(),
        customer: input.customer,
        requestedItems: input.items,
        products: catalogResult.products,
        policy: this.dependencies.policy,
        pricingObservedAt: catalogResult.observedAt,
        createdAt: now,
      });
    } catch (error) {
      if (error instanceof RangeError && error.message.includes('subtotal')) {
        throw new ApplicationError(
          422,
          'ORDER_AMOUNT_LIMIT_EXCEEDED',
          'Valor do pedido excedido',
          'O subtotal do pedido excede o limite permitido.',
        );
      }
      throw error;
    }

    return this.dependencies.repository.create(order, input.correlationId);
  }
}
