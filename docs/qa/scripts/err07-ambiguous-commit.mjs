import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import net from 'node:net';
import { once } from 'node:events';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const require = createRequire(join(root, 'pedidos-typescript/package.json'));
const { Pool } = require('pg');
const databaseUrl = new URL(process.env.ORDERS_DATABASE_URL ?? '');
const migrationUrl = new URL(process.env.ORDERS_MIGRATION_DATABASE_URL ?? '');
const catalogUrl = new URL(process.env.CATALOG_URL ?? '');
const postgresPort = Number(process.env.QA_POSTGRES_PORT);

assert.equal(databaseUrl.hostname, '127.0.0.1');
assert.equal(databaseUrl.port, String(postgresPort));
assert.equal(databaseUrl.pathname, '/orders');
assert.equal(migrationUrl.hostname, '127.0.0.1');
assert.equal(migrationUrl.port, String(postgresPort));
assert.equal(migrationUrl.pathname, '/orders');
assert.equal(catalogUrl.hostname, '127.0.0.1');
assert.equal(catalogUrl.port, '38080');
assert.equal(postgresPort, 35432);

function nextFrame(buffer, startup) {
  if (startup) {
    if (buffer.length < 4) return undefined;
    const size = buffer.readUInt32BE(0);
    if (buffer.length < size) return undefined;
    return { frame: buffer.subarray(0, size), rest: buffer.subarray(size) };
  }
  if (buffer.length < 5) return undefined;
  const size = 1 + buffer.readUInt32BE(1);
  if (buffer.length < size) return undefined;
  return { frame: buffer.subarray(0, size), rest: buffer.subarray(size) };
}

let commitQueries = 0;
let acknowledgementsSuppressed = 0;
const proxySockets = new Set();
const proxy = net.createServer((client) => {
  const database = net.connect({ host: '127.0.0.1', port: postgresPort });
  proxySockets.add(client);
  proxySockets.add(database);
  client.setNoDelay(true);
  database.setNoDelay(true);
  let frontend = Buffer.alloc(0);
  let startup = true;
  let backend = Buffer.alloc(0);
  let awaitingCommitAcknowledgement = false;
  let intercepted = false;

  client.on('data', (chunk) => {
    frontend = Buffer.concat([frontend, chunk]);
    while (true) {
      const result = nextFrame(frontend, startup);
      if (!result) return;
      frontend = result.rest;
      const { frame } = result;
      if (startup) {
        startup = false;
      } else if (frame[0] === 0x51) {
        const sql = frame.toString('utf8', 5, frame.length - 1).trim().replace(/;$/, '');
        if (/^COMMIT(?:\s|$)/i.test(sql)) {
          commitQueries += 1;
          awaitingCommitAcknowledgement = true;
        }
      }
      database.write(frame);
    }
  });

  database.on('data', (chunk) => {
    backend = Buffer.concat([backend, chunk]);
    while (true) {
      const result = nextFrame(backend, false);
      if (!result) return;
      backend = result.rest;
      const { frame } = result;
      const commandTag = frame[0] === 0x43 ? frame.toString('utf8', 5) : '';
      if (awaitingCommitAcknowledgement && commandTag === 'COMMIT\0') {
        acknowledgementsSuppressed += 1;
        intercepted = true;
        client.destroy();
        database.destroy();
        return;
      }
      client.write(frame);
    }
  });

  client.on('error', () => undefined);
  database.on('error', () => {
    if (!client.destroyed) client.destroy();
  });
  client.on('close', () => {
    proxySockets.delete(client);
    if (!intercepted && !database.destroyed) database.destroy();
  });
  database.on('close', () => proxySockets.delete(database));
});

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server.address().port;
}

async function closeServer(server) {
  if (!server.listening) return;
  server.close();
  await once(server, 'close');
}

const proxyPort = await listen(proxy);
const apiProbe = net.createServer();
const apiPort = await listen(apiProbe);
await closeServer(apiProbe);

databaseUrl.port = String(proxyPort);
const appEnvironment = {
  ...process.env,
  ORDERS_PORT: String(apiPort),
  ORDERS_DATABASE_URL: databaseUrl.toString(),
  CATALOG_URL: catalogUrl.toString().replace(/\/$/, ''),
};
const app = spawn(process.execPath, ['dist/main.js'], {
  cwd: join(root, 'pedidos-typescript'),
  env: appEnvironment,
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});

let appLogs = '';
for (const stream of [app.stdout, app.stderr]) {
  stream.setEncoding('utf8');
  stream.on('data', (chunk) => {
    appLogs = (appLogs + chunk).slice(-100_000);
  });
}

const verificationPool = new Pool({ connectionString: process.env.ORDERS_DATABASE_URL, max: 1 });
const email = `qa-ambiguous-${randomUUID()}@example.test`;
let appExited = false;
let appExitCode;
let appExitSignal;
app.once('exit', (code, signal) => {
  appExited = true;
  appExitCode = code;
  appExitSignal = signal;
});

async function waitReady() {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (appExited) throw new Error('Isolated Orders process exited before readiness.');
    try {
      const response = await fetch(`http://127.0.0.1:${apiPort}/health/ready`, {
        signal: AbortSignal.timeout(1_000),
      });
      if (response.ok) return;
    } catch {
      // The process may need a short interval to listen and connect through the proxy.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Isolated Orders process did not become ready through the proxy.');
}

let exitPromise;
let phase = 'waiting for readiness';
try {
  await waitReady();
  phase = 'sending the synthetic order';
  const correlationId = randomUUID();
  const response = await fetch(`http://127.0.0.1:${apiPort}/api/v1/orders`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-correlation-id': correlationId },
    body: JSON.stringify({
      customer: { name: 'QA Ambiguous Commit', email },
      items: [
        { productId: '11111111-1111-4111-8111-111111111111', quantity: 2 },
        { productId: '22222222-2222-4222-8222-222222222222', quantity: 1 },
      ],
    }),
    signal: AbortSignal.timeout(7_000),
  });
  const problem = await response.json();
  phase = 'checking the API response and committed rows';
  assert.equal(response.status, 503);
  assert.equal(problem.code, 'PERSISTENCE_UNAVAILABLE');
  assert.equal(problem.traceId, correlationId);
  assert.equal(acknowledgementsSuppressed, 1);
  assert.equal(commitQueries, 1);

  const storedOrders = await verificationPool.query(
    'SELECT id, item_count, total_cents FROM orders WHERE customer_email = $1',
    [email],
  );
  assert.equal(storedOrders.rowCount, 1);
  assert.equal(storedOrders.rows[0].item_count, 2);
  const storedItems = await verificationPool.query('SELECT count(*)::integer AS count FROM order_items WHERE order_id = $1', [storedOrders.rows[0].id]);
  assert.equal(storedItems.rows[0].count, 2);
  const live = await fetch(`http://127.0.0.1:${apiPort}/health/live`);
  assert.equal(live.status, 200);
  const ambiguityLog = appLogs
    .split(/\r?\n/)
    .find((line) => line.includes('Order commit outcome ambiguous retry=false'));
  assert.ok(ambiguityLog, 'Expected an explicit sanitized ambiguous-commit log.');
  assert.ok(ambiguityLog.includes(`traceId=${correlationId}`));

  console.log(
    JSON.stringify({
      apiStatus: response.status,
      apiCode: problem.code,
      commitQueries,
      commitAcknowledgementsSuppressed: acknowledgementsSuppressed,
      committedOrders: storedOrders.rowCount,
      committedItems: storedItems.rows[0].count,
      processLiveStatus: live.status,
      ambiguousLog: ambiguityLog.trim(),
      productionTraffic: false,
    }),
  );
} catch (error) {
  const diagnostic = appLogs
    .split(/\r?\n/)
    .filter((line) => /ambiguous|ERROR|HttpRequest|unhandled|Connection terminated|ECONNRESET/.test(line))
    .slice(-12);
  let liveStatus;
  try {
    liveStatus = (await fetch(`http://127.0.0.1:${apiPort}/health/live`, {
      signal: AbortSignal.timeout(1_000),
    })).status;
  } catch {
    liveStatus = 'unreachable';
  }
  const visibleOrders = await verificationPool
    .query('SELECT count(*)::integer AS count FROM orders WHERE customer_email = $1', [email])
    .then((result) => result.rows[0].count)
    .catch(() => 'unavailable');
  console.error(
    JSON.stringify({
      phase,
      errorName: error instanceof Error ? error.name : typeof error,
      errorCode: error && typeof error === 'object' && 'code' in error ? error.code : undefined,
      commitQueries,
      commitAcknowledgementsSuppressed: acknowledgementsSuppressed,
      appExited,
      appExitCode,
      appExitSignal,
      liveStatus,
      committedOrderCount: visibleOrders,
      appEvents: diagnostic,
    }),
  );
  throw error;
} finally {
  if (!appExited) {
    app.kill();
    exitPromise = once(app, 'exit');
    await Promise.race([exitPromise, new Promise((resolve) => setTimeout(resolve, 3_000))]);
  }
  await verificationPool.end();
  for (const socket of proxySockets) socket.destroy();
  await closeServer(proxy);
}
