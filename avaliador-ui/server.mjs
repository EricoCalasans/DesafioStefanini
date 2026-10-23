import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT ?? 4173);
const PUBLIC_DIRECTORY = join(fileURLToPath(new URL('.', import.meta.url)), 'public');
const BODY_LIMIT_BYTES = 65_536;
const REQUEST_TIMEOUT_MS = 20_000;
const upstreams = {
  catalog: process.env.CATALOG_UPSTREAM ?? 'http://catalog:8080',
  orders: process.env.ORDERS_UPSTREAM ?? 'http://orders:3000',
};

const staticFiles = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
]);

const proxyRoutes = [
  { method: 'GET', service: 'catalog', prefix: '/api/catalog', pattern: /^\/api\/catalog\/health\/(?:live|ready)$/ },
  { method: 'GET', service: 'catalog', prefix: '/api/catalog', pattern: /^\/api\/catalog\/api\/v1\/products$/ },
  { method: 'GET', service: 'catalog', prefix: '/api/catalog', pattern: /^\/api\/catalog\/api\/v1\/products\/[A-Za-z0-9-]+$/ },
  { method: 'POST', service: 'catalog', prefix: '/api/catalog', pattern: /^\/api\/catalog\/api\/v1\/products\/query$/ },
  { method: 'GET', service: 'orders', prefix: '/api/orders', pattern: /^\/api\/orders\/health\/(?:live|ready)$/ },
  { method: 'GET', service: 'orders', prefix: '/api/orders', pattern: /^\/api\/orders\/api\/v1\/orders$/ },
  { method: 'GET', service: 'orders', prefix: '/api/orders', pattern: /^\/api\/orders\/api\/v1\/orders\/[A-Za-z0-9-]+$/ },
  { method: 'POST', service: 'orders', prefix: '/api/orders', pattern: /^\/api\/orders\/api\/v1\/orders$/ },
];

const securityHeaders = {
  'cache-control': 'no-store',
  'content-security-policy': "default-src 'self'; base-uri 'none'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self'",
  'permissions-policy': 'camera=(), geolocation=(), microphone=()',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
};

function setSecurityHeaders(response) {
  for (const [name, value] of Object.entries(securityHeaders)) response.setHeader(name, value);
}

function sendJson(response, statusCode, payload, headers = {}) {
  setSecurityHeaders(response);
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8', ...headers });
  response.end(JSON.stringify(payload));
}

async function readRequestBody(request) {
  const chunks = [];
  let length = 0;
  let tooLarge = false;

  for await (const chunk of request) {
    length += chunk.length;
    if (length > BODY_LIMIT_BYTES) {
      tooLarge = true;
      continue;
    }
    chunks.push(chunk);
  }

  if (tooLarge) {
    const error = new Error('Request body exceeds the local proxy limit.');
    error.statusCode = 413;
    throw error;
  }

  return Buffer.concat(chunks);
}

async function serveStatic(response, asset) {
  try {
    const [fileName, contentType] = asset;
    const body = await readFile(join(PUBLIC_DIRECTORY, fileName));
    setSecurityHeaders(response);
    response.writeHead(200, { 'content-type': contentType });
    response.end(body);
  } catch {
    sendJson(response, 500, { error: 'A interface local não pôde ser carregada.' });
  }
}

function findRoute(method, pathname) {
  return proxyRoutes.find((route) => route.method === method && route.pattern.test(pathname));
}

function routeExists(pathname) {
  return proxyRoutes.some((route) => route.pattern.test(pathname));
}

async function proxyRequest(request, response, requestUrl, route) {
  const startedAt = performance.now();
  const correlationId = request.headers['x-correlation-id'];
  const upstreamPath = requestUrl.pathname.slice(route.prefix.length);
  const upstreamUrl = new URL(`${upstreamPath}${requestUrl.search}`, upstreams[route.service]);
  const headers = { accept: request.headers.accept ?? 'application/json' };
  const contentType = request.headers['content-type'];

  if (typeof contentType === 'string') headers['content-type'] = contentType;
  if (typeof correlationId === 'string') headers['x-correlation-id'] = correlationId;

  try {
    const body = request.method === 'POST' ? await readRequestBody(request) : undefined;
    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const responseBody = Buffer.from(await upstreamResponse.arrayBuffer());
    const responseHeaders = {};
    for (const headerName of ['content-type', 'x-correlation-id', 'location']) {
      const headerValue = upstreamResponse.headers.get(headerName);
      if (headerValue) responseHeaders[headerName] = headerValue;
    }

    setSecurityHeaders(response);
    response.writeHead(upstreamResponse.status, responseHeaders);
    response.end(responseBody);
    const elapsedMs = Math.round((performance.now() - startedAt) * 100) / 100;
    console.log(`${request.method} ${requestUrl.pathname} ${upstreamResponse.status} ${elapsedMs}ms`);
  } catch (error) {
    const statusCode = error?.statusCode === 413
      ? 413
      : error?.name === 'TimeoutError' || error?.name === 'AbortError'
        ? 504
        : 502;
    const traceId = typeof correlationId === 'string' ? correlationId : randomUUID();
    const payload = {
      type: 'about:blank',
      title: statusCode === 413 ? 'Requisição muito grande' : statusCode === 504 ? 'Tempo excedido' : 'Serviço indisponível',
      status: statusCode,
      detail: statusCode === 413
        ? 'O corpo excede o limite de 64 KiB.'
        : statusCode === 504
          ? 'O serviço não respondeu dentro do limite local de 20 segundos.'
          : `Não foi possível encaminhar a requisição ao serviço ${route.service === 'orders' ? 'Pedidos' : 'Catálogo'}.`,
      instance: requestUrl.pathname,
      code: statusCode === 413 ? 'PAYLOAD_TOO_LARGE' : statusCode === 504 ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_UNAVAILABLE',
      traceId,
    };
    sendJson(response, statusCode, payload, { 'x-correlation-id': traceId });
    console.warn(`${request.method} ${requestUrl.pathname} ${statusCode}: ${error?.message ?? 'upstream error'}`);
  }
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? '/', 'http://localhost');

  if (request.method === 'GET' && requestUrl.pathname === '/health/live') {
    sendJson(response, 200, { status: 'UP', service: 'evaluator', checks: [] });
    return;
  }

  if (request.method === 'GET' && staticFiles.has(requestUrl.pathname)) {
    await serveStatic(response, staticFiles.get(requestUrl.pathname));
    return;
  }

  const route = findRoute(request.method, requestUrl.pathname);
  if (route) {
    await proxyRequest(request, response, requestUrl, route);
    return;
  }

  if (routeExists(requestUrl.pathname)) {
    sendJson(response, 405, { error: 'Método não permitido para esta rota do proxy local.' }, { allow: 'GET, POST' });
    return;
  }

  sendJson(response, 404, { error: 'Rota local não encontrada.' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Central de avaliação disponível na porta ${PORT}.`);
});

server.on('error', (error) => {
  console.error('Não foi possível iniciar a central de avaliação.', error);
  process.exitCode = 1;
});
