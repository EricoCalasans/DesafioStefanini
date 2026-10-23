import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

it('enforces the JSON media contract on every routed spelling of order creation', async () => {
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const address = reservation.address();
  if (!address || typeof address === 'string') throw new Error('Test port unavailable.');
  const port = address.port;
  await new Promise<void>((resolve, reject) => {
    reservation.close((error) => (error ? reject(error) : resolve()));
  });

  const process = spawn(
    globalThis.process.execPath,
    [fileURLToPath(new URL('../dist/main.js', import.meta.url))],
    {
      env: {
        ...globalThis.process.env,
        ORDERS_PORT: String(port),
        ORDERS_DATABASE_URL: 'postgresql://qa:synthetic@127.0.0.1:1/orders',
        ORDERS_MIGRATION_DATABASE_URL: 'postgresql://qa:synthetic@127.0.0.1:1/orders',
        CATALOG_URL: 'http://127.0.0.1:1',
      },
      stdio: 'ignore',
      windowsHide: true,
    },
  );
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (process.exitCode !== null) throw new Error('Orders exited before liveness.');
      try {
        ready = (
          await fetch(`http://127.0.0.1:${port}/health/live`, {
            signal: AbortSignal.timeout(1000),
          })
        ).ok;
      } catch {
        // The real bootstrap has not bound the port yet.
      }
      if (ready) break;
      await delay(25);
    }
    expect(ready).toBe(true);
    for (const path of ['/api/v1/orders', '/api/v1/orders/', '/API/v1/orders']) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: '{}',
        signal: AbortSignal.timeout(2000),
      });
      expect(response.status, path).toBe(415);
      expect(response.headers.get('content-type')).toMatch(/^application\/problem\+json/);
      expect(await response.json()).toMatchObject({
        code: 'UNSUPPORTED_MEDIA_TYPE',
        traceId: response.headers.get('x-correlation-id'),
      });
    }
  } finally {
    if (process.exitCode === null) {
      const exited = once(process, 'exit');
      process.kill();
      await exited;
    }
  }
}, 10_000);
