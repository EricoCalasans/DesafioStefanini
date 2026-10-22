import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CatalogClient, OrderPage, OrderRepository } from '../src/application/ports.js';
import type { Order } from '../src/domain/order.js';
import { correlationMiddleware } from '../src/http/correlation.middleware.js';

const firstId = '11111111-1111-4111-8111-111111111111';
const secondId = '22222222-2222-4222-8222-222222222222';
const productObservedAt = '2026-10-22T12:00:00.000Z';
const productFixtures = [
  {
    id: firstId,
    sku: 'KEYBOARD',
    name: 'Keyboard',
    currency: 'BRL' as const,
    priceCents: 20_000n,
    active: true,
    priceVersion: 3,
    updatedAt: productObservedAt,
  },
  {
    id: secondId,
    sku: 'MOUSE',
    name: 'Mouse',
    currency: 'BRL' as const,
    priceCents: 10_000n,
    active: true,
    priceVersion: 7,
    updatedAt: productObservedAt,
  },
];

describe('Orders HTTP API', () => {
  const applications: Array<{ close(): Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(applications.splice(0).map((application) => application.close()));
  });

  async function createApplication() {
    const builtModuleUrl = new URL('../dist/app.module.js', import.meta.url).href;
    const builtPortsUrl = new URL('../dist/application/ports.js', import.meta.url).href;
    const builtFilterUrl = new URL('../dist/http/problem.filter.js', import.meta.url).href;
    const [
      { AppModule },
      { CATALOG_CLIENT, ORDER_REPOSITORY },
      { ProblemExceptionFilter, validationException },
    ] = await Promise.all([import(builtModuleUrl), import(builtPortsUrl), import(builtFilterUrl)]);
    const orders: Order[] = [];
    const catalog: CatalogClient = {
      queryProducts: vi.fn(async (_ids, _correlationId) => ({
        products: productFixtures,
        missingProductIds: [],
        observedAt: productObservedAt,
      })),
    };
    const repository: OrderRepository = {
      create: async (order) => {
        orders.push(order);
        return order;
      },
      findById: async (id) => orders.find((order) => order.id === id) ?? null,
      list: async (page, pageSize): Promise<OrderPage> => {
        const summaries = orders.slice((page - 1) * pageSize, page * pageSize).map((order) => ({
          id: order.id,
          customer: order.customer,
          currency: order.currency,
          subtotalCents: order.subtotalCents,
          discountAmountCents: order.discount.amountCents,
          totalCents: order.totalCents,
          status: order.status,
          itemCount: order.items.length,
          createdAt: order.createdAt,
        }));
        return {
          data: summaries,
          meta: {
            page,
            pageSize,
            totalItems: orders.length,
            totalPages: orders.length === 0 ? 0 : Math.ceil(orders.length / pageSize),
          },
        };
      },
      checkReady: async () => undefined,
    };
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ORDER_REPOSITORY)
      .useValue(repository)
      .overrideProvider(CATALOG_CLIENT)
      .useValue(catalog)
      .compile();
    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1', {
      exclude: [
        { path: 'health/live', method: RequestMethod.GET },
        { path: 'health/ready', method: RequestMethod.GET },
      ],
    });
    app.use(correlationMiddleware);
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        transformOptions: { enableImplicitConversion: false },
        exceptionFactory: validationException,
      }),
    );
    app.useGlobalFilters(new ProblemExceptionFilter());
    await app.init();
    applications.push(app);
    return { app, orders, catalog };
  }

  it('creates, retrieves, and lists a complete pricing snapshot with correlation', async () => {
    const { app, orders, catalog } = await createApplication();
    const correlationId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const created = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('X-Correlation-Id', correlationId)
      .send({
        customer: { name: '  Cliente Exemplo  ', email: ' cliente@example.com ' },
        items: [
          { productId: firstId, quantity: 2 },
          { productId: secondId, quantity: 1 },
        ],
      })
      .expect('X-Correlation-Id', correlationId)
      .expect(201);

    expect(created.headers.location).toMatch(/^\/api\/v1\/orders\/[0-9a-f-]+$/);

    expect(created.body.customer).toEqual({
      name: 'Cliente Exemplo',
      email: 'cliente@example.com',
    });
    expect(created.body.subtotalCents).toBe(50_000);
    expect(created.body.discount).toMatchObject({
      applied: true,
      amountCents: 5_000,
      policy: { ruleId: 'test-v1' },
    });
    expect(created.body.totalCents).toBe(45_000);
    expect(created.body.items.map((item: { lineNumber: number }) => item.lineNumber)).toEqual([
      1, 2,
    ]);
    expect(orders).toHaveLength(1);

    const found = await request(app.getHttpServer())
      .get(`/api/v1/orders/${created.body.id}`)
      .expect(200);
    expect(found.body).toEqual(created.body);
    expect(catalog.queryProducts).toHaveBeenCalledTimes(1);

    const listed = await request(app.getHttpServer())
      .get('/api/v1/orders?page=1&pageSize=5')
      .expect(200);
    expect(listed.body.meta).toEqual({ page: 1, pageSize: 5, totalItems: 1, totalPages: 1 });
    expect(listed.body.data[0]).toMatchObject({
      id: created.body.id,
      itemCount: 2,
      totalCents: 45_000,
    });
  });

  it('rejects extra client-controlled fields, malformed paging, and duplicate products', async () => {
    const { app } = await createApplication();
    const invalidBody = {
      customer: { name: 'Cliente', email: 'cliente@example.com' },
      items: [{ productId: firstId, quantity: 1, unitPrice: 1 }],
    };
    const extraField = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .send(invalidBody)
      .expect(400);
    expect(extraField.body).toMatchObject({ code: 'VALIDATION_ERROR', status: 400 });
    expect(extraField.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'items.0.unitPrice', code: 'UNKNOWN_FIELD' }),
      ]),
    );

    const duplicate = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .send({
        customer: { name: 'Cliente', email: 'cliente@example.com' },
        items: [
          { productId: firstId, quantity: 1 },
          { productId: firstId, quantity: 2 },
        ],
      })
      .expect(422);
    expect(duplicate.body.code).toBe('DUPLICATE_PRODUCT_IDS');

    const paging = await request(app.getHttpServer()).get('/api/v1/orders?page=01').expect(400);
    expect(paging.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns typed not-found and validation errors', async () => {
    const { app } = await createApplication();
    await request(app.getHttpServer()).get('/api/v1/orders/not-a-uuid').expect(400);
    const missing = await request(app.getHttpServer())
      .get('/api/v1/orders/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
      .expect(404);
    expect(missing.body.code).toBe('ORDER_NOT_FOUND');
  });
});
