import { afterEach, describe, expect, it, vi } from 'vitest';
import { CatalogHttpClient } from '../src/adapters/catalog-http.client.js';
import { ApplicationError } from '../src/application/errors.js';

const firstId = '11111111-1111-4111-8111-111111111111';
const secondId = '22222222-2222-4222-8222-222222222222';
const correlationId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const observedAt = '2026-10-22T12:00:00.000Z';

function product(id: string, sku: string, priceCents: number) {
  return {
    id,
    sku,
    name: `Product ${sku}`,
    currency: 'BRL',
    priceCents,
    active: true,
    priceVersion: 1,
    updatedAt: observedAt,
  };
}

function client(): CatalogHttpClient {
  return new CatalogHttpClient({ catalogUrl: 'http://catalog.test' } as never);
}

function validPayload() {
  return {
    products: [product(firstId, 'KEYBOARD', 20_000)],
    missingProductIds: [] as string[],
    observedAt,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('CatalogHttpClient', () => {
  it.each<[string, (payload: ReturnType<typeof validPayload>) => unknown]>([
    ['currency', (p) => ({ ...p, products: [{ ...p.products[0], currency: 'USD' }] })],
    ['numeric string', (p) => ({ ...p, products: [{ ...p.products[0], priceCents: '20000' }] })],
    ['fractional price', (p) => ({ ...p, products: [{ ...p.products[0], priceCents: 1.5 }] })],
    [
      'price over limit',
      (p) => ({ ...p, products: [{ ...p.products[0], priceCents: 100_000_001 }] }),
    ],
    ['active type', (p) => ({ ...p, products: [{ ...p.products[0], active: 'true' }] })],
    ['version zero', (p) => ({ ...p, products: [{ ...p.products[0], priceVersion: 0 }] })],
    [
      'version overflow',
      (p) => ({ ...p, products: [{ ...p.products[0], priceVersion: 2_147_483_648 }] }),
    ],
    ['text control', (p) => ({ ...p, products: [{ ...p.products[0], name: 'QA\u0000X' }] })],
    ['SKU over limit', (p) => ({ ...p, products: [{ ...p.products[0], sku: '😀'.repeat(41) }] })],
    [
      'impossible date',
      (p) => ({ ...p, products: [{ ...p.products[0], updatedAt: '2026-02-30T00:00:00Z' }] }),
    ],
    ['non-leap date', (p) => ({ ...p, observedAt: '2025-02-29T00:00:00Z' })],
    ['non-UTC date', (p) => ({ ...p, observedAt: '2026-10-22T09:00:00-03:00' })],
    ['extra product field', (p) => ({ ...p, products: [{ ...p.products[0], admin: true }] })],
    ['duplicate product', (p) => ({ ...p, products: [p.products[0], p.products[0]] })],
    ['found and missing', (p) => ({ ...p, missingProductIds: [firstId] })],
    ['duplicate missing', (p) => ({ ...p, products: [], missingProductIds: [firstId, firstId] })],
    ['malformed missing ID', (p) => ({ ...p, products: [], missingProductIds: ['not-a-uuid'] })],
    ['extra batch field', (p) => ({ ...p, privateField: true })],
    ['array root', () => []],
  ])('rejects supplier contract violation: %s', async (_label, mutate) => {
    const fetchMock = vi.fn(async () => Response.json(mutate(validPayload())));
    vi.stubGlobal('fetch', fetchMock);
    await expect(client().queryProducts([firstId], correlationId)).rejects.toMatchObject({
      status: 502,
      code: 'CATALOG_INVALID_RESPONSE',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed UTF-8 and maps network connection failure without exposing details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(new Uint8Array([0xff]), {
            headers: { 'content-type': 'application/json' },
          }),
      ),
    );
    await expect(client().queryProducts([firstId], correlationId)).rejects.toMatchObject({
      status: 502,
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('private connection detail');
      }),
    );
    await expect(client().queryProducts([firstId], correlationId)).rejects.toMatchObject({
      status: 503,
      code: 'CATALOG_UNAVAILABLE',
      detail: 'Não foi possível consultar o Catálogo.',
    });
  });

  it('sends one correlated batch and validates the complete response', async () => {
    const fetchMock = vi.fn(async () =>
      Response.json({
        products: [product(firstId, 'KEYBOARD', 20_000)],
        missingProductIds: [secondId],
        observedAt,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await client().queryProducts([firstId, secondId], correlationId);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('http://catalog.test/api/v1/products/query');
    expect(new Headers(init.headers).get('x-correlation-id')).toBe(correlationId);
    expect(JSON.parse(String(init.body))).toEqual({ productIds: [firstId, secondId] });
    expect(result.products[0]?.priceCents).toBe(20_000n);
    expect(result.missingProductIds).toEqual([secondId]);
  });

  it('rejects incomplete or out-of-domain supplier responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          products: [product(firstId, 'KEYBOARD', 20_000)],
          missingProductIds: [],
          observedAt,
        }),
      ),
    );
    await expect(client().queryProducts([firstId, secondId], correlationId)).rejects.toMatchObject({
      status: 502,
      code: 'CATALOG_INVALID_RESPONSE',
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          products: [product(firstId, 'KEYBOARD', 0)],
          missingProductIds: [secondId],
          observedAt,
        }),
      ),
    );
    await expect(client().queryProducts([firstId, secondId], correlationId)).rejects.toBeInstanceOf(
      ApplicationError,
    );
  });

  it('maps supplier 5xx to a sanitized unavailable error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('secret upstream detail', { status: 503 })),
    );
    const error = await client()
      .queryProducts([firstId], correlationId)
      .catch((reason: unknown) => reason);
    expect(error).toMatchObject({ status: 503, code: 'CATALOG_UNAVAILABLE' });
    expect(error).toMatchObject({ detail: 'O Catálogo não está disponível neste momento.' });
    expect(error).not.toHaveProperty('detail', expect.stringContaining('secret upstream detail'));
  });

  it('maps unexpected supplier 4xx responses to a sanitized contract error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('private supplier detail', { status: 400 })),
    );

    const error = await client()
      .queryProducts([firstId], correlationId)
      .catch((reason: unknown) => reason);
    expect(error).toMatchObject({ status: 502, code: 'CATALOG_INVALID_RESPONSE' });
    expect(error).not.toHaveProperty('detail', expect.stringContaining('private supplier detail'));
  });

  it('rejects non-JSON and malformed JSON supplier responses with a sanitized message', async () => {
    const responseFactories = [
      () =>
        new Response('private response', {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        }),
      () =>
        new Response('{broken', { status: 200, headers: { 'content-type': 'application/json' } }),
    ];

    for (const createResponse of responseFactories) {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => createResponse()),
      );
      const error = await client()
        .queryProducts([firstId], correlationId)
        .catch((reason: unknown) => reason);
      expect(error).toMatchObject({
        status: 502,
        code: 'CATALOG_INVALID_RESPONSE',
        detail: 'O Catálogo retornou dados que não correspondem ao contrato esperado.',
      });
      expect(error).not.toHaveProperty('detail', expect.stringContaining('private response'));
    }
  });

  it('rejects supplier products outside the requested ID set', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          products: [product(secondId, 'MOUSE', 10_000)],
          missingProductIds: [],
          observedAt,
        }),
      ),
    );

    await expect(client().queryProducts([firstId], correlationId)).rejects.toMatchObject({
      status: 502,
      code: 'CATALOG_INVALID_RESPONSE',
    });
  });

  it('bounds the response body before parsing it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('x'.repeat(256 * 1024 + 1), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
      ),
    );
    await expect(client().queryProducts([firstId], correlationId)).rejects.toMatchObject({
      status: 502,
      code: 'CATALOG_INVALID_RESPONSE',
    });
  });

  it('rejects a response whose declared content length exceeds the limit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('{}', {
            headers: {
              'content-type': 'application/json',
              'content-length': String(256 * 1024 + 1),
            },
          }),
      ),
    );

    await expect(client().queryProducts([firstId], correlationId)).rejects.toMatchObject({
      status: 502,
      code: 'CATALOG_INVALID_RESPONSE',
    });
  });

  it('rejects empty bodies, failed body streams, and unexpected response access errors', async () => {
    const brokenStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error('private stream detail'));
      },
    });
    const unusualResponse = {
      status: 200,
      headers: {
        get: () => {
          throw new Error('private header detail');
        },
      },
      body: null,
    } as unknown as Response;
    const responses = [
      new Response(null, { headers: { 'content-type': 'application/json' } }),
      new Response(brokenStream, { headers: { 'content-type': 'application/json' } }),
      unusualResponse,
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => responses.shift() as Response),
    );

    for (let attempt = 0; attempt < 3; attempt++) {
      await expect(client().queryProducts([firstId], correlationId)).rejects.toMatchObject({
        status: 502,
        code: 'CATALOG_INVALID_RESPONSE',
      });
    }
  });

  it('keeps the timeout active until the response body finishes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string | URL, init?: RequestInit) => {
        const signal = init?.signal;
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            signal?.addEventListener('abort', () =>
              controller.error(new DOMException('aborted', 'AbortError')),
            );
          },
        });
        return new Response(stream, {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }),
    );

    await expect(client().queryProducts([firstId], correlationId)).rejects.toMatchObject({
      status: 504,
      code: 'CATALOG_TIMEOUT',
    });
  }, 5_000);

  it('maps a timeout while waiting for the supplier response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async (_url: string | URL, init?: RequestInit) =>
          await new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('aborted', 'AbortError')),
            );
          }),
      ),
    );

    await expect(client().queryProducts([firstId], correlationId)).rejects.toMatchObject({
      status: 504,
      code: 'CATALOG_TIMEOUT',
    });
  }, 5_000);
});
