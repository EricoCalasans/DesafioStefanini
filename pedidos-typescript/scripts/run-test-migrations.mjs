import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const migrationUrl = process.env.ORDERS_TEST_MIGRATION_DATABASE_URL;
if (!migrationUrl) {
  throw new Error('ORDERS_TEST_MIGRATION_DATABASE_URL is required for integration tests.');
}

const parsedUrl = new URL(migrationUrl);
if (parsedUrl.pathname !== '/orders_test') {
  throw new Error('Integration migrations are restricted to the orders_test database.');
}

const runner = fileURLToPath(new URL('../dist/migrations/run.js', import.meta.url));
const result = spawnSync(process.execPath, [runner], {
  env: { ...process.env, ORDERS_MIGRATION_DATABASE_URL: migrationUrl },
  stdio: 'inherit',
});

if (result.error) throw result.error;
if (result.status !== 0) process.exitCode = result.status ?? 1;
