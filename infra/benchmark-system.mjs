import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';

function positiveInteger(value, name, fallback, maximum) {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new Error(`${name} must be an integer between 1 and ${maximum}.`);
  }
  return parsed;
}

function optionsFromArguments(args) {
  const options = new Map();
  for (const argument of args) {
    const match = /^--(requests|concurrency|warmups)=(\d+)$/.exec(argument);
    if (!match) throw new Error(`Unknown argument: ${argument}`);
    if (options.has(match[1])) throw new Error(`Duplicate argument: ${match[1]}`);
    options.set(match[1], match[2]);
  }
  return options;
}

function percentile(sortedValues, percentileRank) {
  const index = Math.max(0, Math.ceil(sortedValues.length * percentileRank) - 1);
  return sortedValues[index];
}

async function request(url, init) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(5_000) });
  await response.arrayBuffer();
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
}

async function runCase(testCase, { requests, concurrency, warmups }) {
  for (let index = 0; index < warmups; index += 1) await request(...testCase.request(index));

  const samples = [];
  let nextRequest = 0;
  const startedAt = performance.now();
  await Promise.all(
    Array.from({ length: Math.min(concurrency, requests) }, async () => {
      while (nextRequest < requests) {
        const requestIndex = nextRequest;
        nextRequest += 1;
        const requestStartedAt = performance.now();
        try {
          await request(...testCase.request(requestIndex + warmups));
          samples.push({ ok: true, elapsedMs: performance.now() - requestStartedAt });
        } catch (error) {
          samples.push({
            ok: false,
            elapsedMs: performance.now() - requestStartedAt,
            failure: error instanceof Error ? error.name : 'UnknownError',
          });
        }
      }
    }),
  );
  const elapsedMs = performance.now() - startedAt;
  const successful = samples.filter((sample) => sample.ok);
  const sorted = successful.map((sample) => sample.elapsedMs).sort((left, right) => left - right);

  return {
    name: testCase.name,
    attempted: samples.length,
    succeeded: successful.length,
    failed: samples.length - successful.length,
    elapsedMs: Number(elapsedMs.toFixed(2)),
    requestsPerSecond: Number((successful.length / (elapsedMs / 1_000)).toFixed(2)),
    latencyMs: sorted.length
      ? {
          p50: Number(percentile(sorted, 0.5).toFixed(2)),
          p95: Number(percentile(sorted, 0.95).toFixed(2)),
          p99: Number(percentile(sorted, 0.99).toFixed(2)),
          max: Number(sorted.at(-1).toFixed(2)),
        }
      : null,
    failureClasses: Object.fromEntries(
      samples
        .filter((sample) => !sample.ok)
        .reduce((counts, sample) => counts.set(sample.failure, (counts.get(sample.failure) ?? 0) + 1), new Map()),
    ),
  };
}

const options = optionsFromArguments(process.argv.slice(2));
const requests = positiveInteger(options.get('requests'), '--requests', 100, 5_000);
const concurrency = positiveInteger(options.get('concurrency'), '--concurrency', 8, 100);
const warmups = positiveInteger(options.get('warmups'), '--warmups', 2, 100);
const ordersUrl = (process.env.ORDERS_BENCHMARK_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const catalogUrl = (process.env.CATALOG_BENCHMARK_URL ?? 'http://127.0.0.1:8080').replace(/\/$/, '');

const cases = [
  {
    name: 'catalog-active-products-page',
    request: () => [`${catalogUrl}/api/v1/products?page=1&pageSize=20`],
  },
  {
    name: 'orders-summary-page',
    request: () => [`${ordersUrl}/api/v1/orders?page=1&pageSize=20`],
  },
  ...[1, 10, 100].map((batchSize) => ({
    name: `catalog-batch-${batchSize}`,
    request: () => [
      `${catalogUrl}/api/v1/products/query`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ productIds: Array.from({ length: batchSize }, () => randomUUID()) }),
      },
    ],
  })),
];

try {
  const results = [];
  for (const testCase of cases) results.push(await runCase(testCase, { requests, concurrency, warmups }));
  const output = {
    generatedAt: new Date().toISOString(),
    runtime: process.version,
    scenario: { requestsPerCase: requests, concurrency, warmupsPerCase: warmups, readOnly: true },
    cases: results,
  };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  if (results.some((result) => result.failed > 0)) process.exitCode = 1;
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : 'Benchmark failed.'}\n`);
  process.exitCode = 1;
}
