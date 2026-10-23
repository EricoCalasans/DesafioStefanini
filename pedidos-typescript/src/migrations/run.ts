import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { loadMigrationDatabaseUrl } from '../bootstrap/configuration.js';
import { runMigrations } from './runner.js';

const pool = new Pool({
  connectionString: loadMigrationDatabaseUrl(process.env),
  max: 1,
  connectionTimeoutMillis: 1_000,
  idleTimeoutMillis: 5_000,
  options: '-c statement_timeout=2000 -c lock_timeout=1000',
});

const sqlDirectory = join(dirname(fileURLToPath(import.meta.url)), 'sql');
void runMigrations(pool, sqlDirectory).catch(() => {
  process.exitCode = 1;
});
