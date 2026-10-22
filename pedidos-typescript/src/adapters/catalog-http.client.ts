import { Inject, Injectable } from '@nestjs/common';
import { ApplicationError } from '../application/errors.js';
import type { CatalogBatchResult, CatalogClient } from '../application/ports.js';
import { ORDERS_CONFIGURATION } from '../application/ports.js';
import type { OrdersConfiguration } from '../bootstrap/configuration.js';
import type { CatalogProduct } from '../domain/order.js';
import { containsAsciiControlCharacter } from '../domain/text-validation.js';

const PRODUCT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAX_RESPONSE_BYTES = 256 * 1024;
const EXACT_PRODUCT_FIELDS = [
  'active',
  'currency',
  'id',
  'name',
  'priceCents',
  'priceVersion',
  'sku',
  'updatedAt',
].sort();

function invalidResponse(): ApplicationError {
  return new ApplicationError(
    502,
    'CATALOG_INVALID_RESPONSE',
    'Resposta inválida do Catálogo',
    'O Catálogo retornou dados que não correspondem ao contrato esperado.',
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUtcDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|\+00:00)$/.exec(
    value,
  );
  if (!match) return false;
  const [, yearPart, monthPart, dayPart, hourPart, minutePart, secondPart] = match;
  const year = Number(yearPart);
  const month = Number(monthPart);
  const day = Number(dayPart);
  const hour = Number(hourPart);
  const minute = Number(minutePart);
  const second = Number(secondPart);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return (
    year >= 1 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= (daysInMonth[month - 1] ?? 0) &&
    hour <= 23 &&
    minute <= 59 &&
    second <= 59 &&
    Number.isFinite(Date.parse(value))
  );
}

function parseProduct(value: unknown): CatalogProduct | null {
  if (
    !isRecord(value) ||
    JSON.stringify(Object.keys(value).sort()) !== JSON.stringify(EXACT_PRODUCT_FIELDS)
  ) {
    return null;
  }
  const { id, sku, name, currency, priceCents, active, priceVersion, updatedAt } = value;
  if (
    typeof id !== 'string' ||
    !PRODUCT_ID.test(id) ||
    typeof sku !== 'string' ||
    sku.trim().length === 0 ||
    [...sku].length > 40 ||
    containsAsciiControlCharacter(sku) ||
    typeof name !== 'string' ||
    name.trim().length === 0 ||
    [...name].length > 120 ||
    containsAsciiControlCharacter(name) ||
    currency !== 'BRL' ||
    !Number.isSafeInteger(priceCents) ||
    Number(priceCents) < 1 ||
    Number(priceCents) > 100_000_000 ||
    typeof active !== 'boolean' ||
    !Number.isSafeInteger(priceVersion) ||
    Number(priceVersion) < 1 ||
    Number(priceVersion) > 2_147_483_647 ||
    !isUtcDate(updatedAt)
  ) {
    return null;
  }
  return {
    id,
    sku,
    name,
    currency,
    priceCents: BigInt(priceCents as number),
    active,
    priceVersion: priceVersion as number,
    updatedAt,
  };
}

@Injectable()
export class CatalogHttpClient implements CatalogClient {
  constructor(@Inject(ORDERS_CONFIGURATION) private readonly configuration: OrdersConfiguration) {}

  async queryProducts(
    productIds: readonly string[],
    correlationId: string,
  ): Promise<CatalogBatchResult> {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 2_000);
    timer.unref();

    try {
      let response: Response;
      try {
        response = await fetch(`${this.configuration.catalogUrl}/api/v1/products/query`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-correlation-id': correlationId },
          body: JSON.stringify({ productIds }),
          signal: controller.signal,
        });
      } catch {
        if (timedOut) {
          throw new ApplicationError(
            504,
            'CATALOG_TIMEOUT',
            'Tempo limite do Catálogo',
            'A consulta ao Catálogo excedeu o tempo permitido.',
          );
        }
        throw new ApplicationError(
          503,
          'CATALOG_UNAVAILABLE',
          'Catálogo indisponível',
          'Não foi possível consultar o Catálogo.',
        );
      }
      if (response.status !== 200) {
        await response.body?.cancel().catch(() => undefined);
        if (response.status >= 500) {
          throw new ApplicationError(
            503,
            'CATALOG_UNAVAILABLE',
            'Catálogo indisponível',
            'O Catálogo não está disponível neste momento.',
          );
        }
        throw invalidResponse();
      }
      if (!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')) {
        await response.body?.cancel().catch(() => undefined);
        throw invalidResponse();
      }
      const contentLength = response.headers.get('content-length');
      if (
        contentLength &&
        /^\d+$/.test(contentLength) &&
        Number(contentLength) > MAX_RESPONSE_BYTES
      ) {
        await response.body?.cancel().catch(() => undefined);
        throw invalidResponse();
      }

      const bytes = await this.readBounded(response, controller.signal);
      let payload: unknown;
      try {
        payload = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      } catch {
        throw invalidResponse();
      }
      return this.validateBatch(payload, productIds);
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      if (timedOut) {
        throw new ApplicationError(
          504,
          'CATALOG_TIMEOUT',
          'Tempo limite do Catálogo',
          'A consulta ao Catálogo excedeu o tempo permitido.',
        );
      }
      throw invalidResponse();
    } finally {
      clearTimeout(timer);
    }
  }

  private async readBounded(response: Response, signal: AbortSignal): Promise<Uint8Array> {
    if (!response.body) throw invalidResponse();
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_RESPONSE_BYTES) {
          await reader.cancel();
          throw invalidResponse();
        }
        chunks.push(value);
      }
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      if (signal.aborted) throw error;
      throw invalidResponse();
    } finally {
      reader.releaseLock();
    }
    const combined = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return combined;
  }

  private validateBatch(payload: unknown, requestedIds: readonly string[]): CatalogBatchResult {
    if (
      !isRecord(payload) ||
      Object.keys(payload).sort().join(',') !== 'missingProductIds,observedAt,products' ||
      !Array.isArray(payload.products) ||
      !Array.isArray(payload.missingProductIds) ||
      !isUtcDate(payload.observedAt) ||
      payload.products.length > 100 ||
      payload.missingProductIds.length > 100
    ) {
      throw invalidResponse();
    }

    const products = payload.products.map(parseProduct);
    if (products.some((product) => product === null)) throw invalidResponse();
    const productList = products as CatalogProduct[];
    const missingIds = payload.missingProductIds;
    if (missingIds.some((id) => typeof id !== 'string' || !PRODUCT_ID.test(id)))
      throw invalidResponse();
    const returnedIds = productList.map((product) => product.id);
    const allIds = [...returnedIds, ...(missingIds as string[])];
    const requested = new Set(requestedIds);
    if (
      allIds.length !== requestedIds.length ||
      new Set(allIds).size !== allIds.length ||
      allIds.some((id) => !requested.has(id))
    ) {
      throw invalidResponse();
    }

    return {
      products: productList,
      missingProductIds: [...(missingIds as string[])].sort(),
      observedAt: payload.observedAt,
    };
  }
}
