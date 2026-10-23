import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { ApplicationError } from '../src/application/errors.js';
import type { CatalogClient, OrderPage, OrderRepository } from '../src/application/ports.js';
import { CATALOG_CLIENT, ORDER_REPOSITORY } from '../src/application/ports.js';
import type { Order } from '../src/domain/order.js';
import { correlationMiddleware } from '../src/http/correlation.middleware.js';
import { ProblemExceptionFilter, validationException } from '../src/http/problem.filter.js';

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
    const orders: Order[] = [];
    const catalog: CatalogClient = {
      queryProducts: vi.fn(async (_ids, _correlationId) => ({
        products: productFixtures,
        missingProductIds: [],
        observedAt: productObservedAt,
      })),
    };
    const repository: OrderRepository = {
      create: vi.fn(async (order) => {
        orders.push(order);
        return order;
      }),
      findById: vi.fn(async (id) => orders.find((order) => order.id === id) ?? null),
      list: vi.fn(async (page, pageSize): Promise<OrderPage> => {
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
      }),
      checkReady: vi.fn(async () => undefined),
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
    return { app, orders, catalog, repository };
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
    vi.mocked(catalog.queryProducts).mockRejectedValue(new Error('Catálogo desligado'));

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
    expect(catalog.queryProducts).toHaveBeenCalledTimes(1);
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

  it('rejects UUIDs and paging with trailing line breaks before calling dependencies', async () => {
    const { app, orders, catalog } = await createApplication();
    for (const suffix of ['\n', '\r\n']) {
      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .send({
          customer: { name: 'QA', email: 'qa@example.com' },
          items: [{ productId: firstId + suffix, quantity: 1 }],
        })
        .expect(400);
      await request(app.getHttpServer())
        .get(`/api/v1/orders/${firstId}${encodeURIComponent(suffix)}`)
        .expect(400);
      await request(app.getHttpServer())
        .get(`/api/v1/orders?page=1${encodeURIComponent(suffix)}`)
        .expect(400);
    }
    expect(orders).toHaveLength(0);
    expect(catalog.queryProducts).not.toHaveBeenCalled();
  });

  it('rejects malformed customers and item limits before contacting dependencies', async () => {
    const { app, orders, catalog } = await createApplication();
    const validCustomer = { name: 'Cliente', email: 'cliente@example.com' };
    const validItem = { productId: firstId, quantity: 1 };
    const invalidBodies = [
      { items: [validItem] },
      { customer: null, items: [validItem] },
      { customer: { name: '   ', email: 'cliente@example.com' }, items: [validItem] },
      { customer: { name: 'João\u0000', email: 'cliente@example.com' }, items: [validItem] },
      { customer: { name: 'A'.repeat(121), email: 'cliente@example.com' }, items: [validItem] },
      { customer: { name: 'Cliente', email: 'joão@example.com' }, items: [validItem] },
      { customer: validCustomer, items: [] },
      { customer: validCustomer, items: null },
      { customer: validCustomer, items: [null] },
      { customer: validCustomer, items: [{ productId: firstId, quantity: 0 }] },
      { customer: validCustomer, items: [{ productId: firstId, quantity: 10_001 }] },
      { customer: validCustomer, items: [{ productId: firstId, quantity: 1.5 }] },
      { customer: validCustomer, items: [{ productId: firstId, quantity: '1' }] },
      {
        customer: validCustomer,
        items: Array.from({ length: 101 }, () => validItem),
      },
    ];

    for (const body of invalidBodies) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .send(body)
        .expect(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    }

    expect(orders).toHaveLength(0);
    expect(catalog.queryProducts).not.toHaveBeenCalled();
  });

  it('validates list filters and applies default pagination', async () => {
    const { app, repository } = await createApplication();
    for (const query of [
      '?unknown=value',
      '?page=0',
      '?page=1000001',
      '?page=1.5',
      '?page=9007199254740992',
      '?pageSize=0',
      '?pageSize=101',
      '?page=1&page=2',
    ]) {
      const response = await request(app.getHttpServer()).get(`/api/v1/orders${query}`).expect(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    }

    await request(app.getHttpServer()).get('/api/v1/orders').expect(200);
    expect(repository.list).toHaveBeenCalledWith(1, 20);
  });

  it('maps catalog availability failures without creating an order', async () => {
    const { app, orders, catalog } = await createApplication();
    vi.mocked(catalog.queryProducts).mockRejectedValueOnce(
      new ApplicationError(
        503,
        'CATALOG_UNAVAILABLE',
        'Catálogo indisponível',
        'Não foi possível consultar o Catálogo.',
      ),
    );

    const response = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .send({
        customer: { name: 'Cliente', email: 'cliente@example.com' },
        items: [{ productId: firstId, quantity: 1 }],
      })
      .expect(503);

    expect(response.headers['content-type']).toMatch(/^application\/problem\+json/);
    expect(response.body).toMatchObject({
      code: 'CATALOG_UNAVAILABLE',
      detail: 'Não foi possível consultar o Catálogo.',
    });
    expect(orders).toHaveLength(0);
  });

  it.each([undefined, 'invalid-correlation', 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA'])(
    'propagates the normalized correlation ID when the incoming header is %s',
    async (incoming) => {
      const { app, catalog } = await createApplication();
      const pending = request(app.getHttpServer()).post('/api/v1/orders');
      if (incoming) pending.set('X-Correlation-Id', incoming);
      const result = await pending
        .send({
          customer: { name: 'QA', email: 'qa@example.com' },
          items: [{ productId: firstId, quantity: 1 }],
        })
        .expect(201);

      expect(catalog.queryProducts).toHaveBeenCalledWith(
        [firstId],
        result.headers['x-correlation-id'],
      );
    },
  );
});
