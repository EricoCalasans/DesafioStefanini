const baseUrl = (process.env.CHALLENGE_API_URL ?? 'http://127.0.0.1:3000').replace(/\/$/, '');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function expectStatus(response, expectedStatus, operation) {
  assert(response.status === expectedStatus, `${operation} returned HTTP ${response.status}; expected ${expectedStatus}.`);
  return response;
}

async function json(response) {
  return response.json();
}

const live = await expectStatus(await fetch(`${baseUrl}/health/live`), 200, 'liveness');
const liveBody = await json(live);
assert(liveBody.status === 'UP' && liveBody.service === 'orders', 'Liveness response is invalid.');
await expectStatus(await fetch(`${baseUrl}/health/ready`), 200, 'readiness');

const correlationId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const canonicalRequest = {
  customer: { name: 'Smoke Cliente', email: 'smoke@example.com' },
  items: [
    { productId: '11111111-1111-4111-8111-111111111111', quantity: 2 },
    { productId: '22222222-2222-4222-8222-222222222222', quantity: 1 },
  ],
};
const createdResponse = await expectStatus(await fetch(`${baseUrl}/api/v1/orders`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-correlation-id': correlationId },
  body: JSON.stringify(canonicalRequest),
}), 201, 'canonical order creation');
const created = await json(createdResponse);
assert(createdResponse.headers.get('x-correlation-id') === correlationId, 'Correlation ID was not preserved.');
assert(createdResponse.headers.get('location') === `/api/v1/orders/${created.id}`, 'Location header is invalid.');
assert(created.subtotalCents === 50_000 && created.discount.amountCents === 5_000 && created.totalCents === 45_000,
  'Canonical subtotal, discount, or total is incorrect.');
assert(created.items.map((item) => item.lineNumber).join(',') === '1,2', 'Input item order was not preserved.');

const foundResponse = await expectStatus(await fetch(`${baseUrl}/api/v1/orders/${created.id}`), 200, 'order lookup');
const found = await json(foundResponse);
assert(found.id === created.id && found.totalCents === created.totalCents, 'Persisted order snapshot differs from creation.');

const listResponse = await expectStatus(await fetch(`${baseUrl}/api/v1/orders?page=1&pageSize=5`), 200, 'order listing');
const page = await json(listResponse);
assert(page.data.some((order) => order.id === created.id), 'Created order is missing from the list.');
assert(page.meta.page === 1 && page.meta.pageSize === 5 && page.meta.totalItems >= 1, 'Pagination metadata is invalid.');

const literalName = "D'Angelo); DROP TABLE orders;--";
const literalResponse = await expectStatus(await fetch(`${baseUrl}/api/v1/orders`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    customer: { name: literalName, email: 'literal@example.com' },
    items: [{ productId: canonicalRequest.items[0].productId, quantity: 1 }],
  }),
}), 201, 'SQL-like text persistence');
assert((await json(literalResponse)).customer.name === literalName, 'SQL-like text was altered during persistence.');

const invalidBody = await expectStatus(await fetch(`${baseUrl}/api/v1/orders`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ ...canonicalRequest, items: [{ ...canonicalRequest.items[0], unitPrice: 1 }] }),
}), 400, 'client-controlled price rejection');
assert((await json(invalidBody)).code === 'VALIDATION_ERROR', 'Validation Problem Details code is invalid.');

const duplicate = await expectStatus(await fetch(`${baseUrl}/api/v1/orders`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ ...canonicalRequest, items: [canonicalRequest.items[0], canonicalRequest.items[0]] }),
}), 422, 'duplicate product rejection');
assert((await json(duplicate)).code === 'DUPLICATE_PRODUCT_IDS', 'Duplicate ID code is invalid.');

const inactive = await expectStatus(await fetch(`${baseUrl}/api/v1/orders`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    customer: canonicalRequest.customer,
    items: [{ productId: '44444444-4444-4444-8444-444444444444', quantity: 1 }],
  }),
}), 422, 'inactive product rejection');
assert((await json(inactive)).code === 'PRODUCTS_NOT_ORDERABLE', 'Inactive product error code is invalid.');

await expectStatus(await fetch(`${baseUrl}/api/v1/orders`, {
  method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{}',
}), 415, 'unsupported content type');
await expectStatus(await fetch(`${baseUrl}/api/v1/orders`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad',
}), 400, 'malformed JSON');
await expectStatus(await fetch(`${baseUrl}/api/v1/orders`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: 'x'.repeat(70_000),
}), 413, 'oversized body');
await expectStatus(await fetch(`${baseUrl}/api/v1/orders?page=01`), 400, 'invalid pagination');
await expectStatus(await fetch(`${baseUrl}/api/v1/orders/not-a-uuid`), 400, 'invalid order ID');
await expectStatus(await fetch(`${baseUrl}/api/v1/orders/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`), 404, 'missing order');

const docsResponse = await expectStatus(await fetch(`${baseUrl}/docs-json`), 200, 'OpenAPI document');
const docs = await json(docsResponse);
assert(docs.paths['/api/v1/orders']?.post?.responses?.['201'], 'OpenAPI is missing the create response.');
assert(docs.paths['/api/v1/orders/{orderId}']?.get?.responses?.['200'], 'OpenAPI is missing the order lookup response.');
assert(docs.components.schemas.OrderResponseDto && docs.components.schemas.ProblemDetailsResponseDto,
  'OpenAPI is missing response schemas.');

console.log('System smoke passed: health, create, snapshot lookup, pagination, validation, dependency errors, and OpenAPI.');
