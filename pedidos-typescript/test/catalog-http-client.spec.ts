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

afterEach(() => vi.unstubAllGlobals());

describe('CatalogHttpClient', () => {
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
    await expect(client().queryProducts([firstId], correlationId)).rejects.toMatchObject({
      status: 503,
      code: 'CATALOG_UNAVAILABLE',
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
});
