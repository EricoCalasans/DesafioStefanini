import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Pool, PoolClient } from 'pg';

type MigrationPool = Pick<Pool, 'connect' | 'end'>;
type MigrationClient = Pick<PoolClient, 'query' | 'release'>;

export async function runMigrations(pool: MigrationPool, sqlDirectory: string): Promise<void> {
  const files = (await readdir(sqlDirectory))
    .filter((file) => /^\d+_[a-z0-9_-]+\.sql$/.test(file))
    .sort();
  let client: MigrationClient | undefined;
  let appliedCount = 0;
  try {
    const connected = await pool.connect();
    client = connected;
    await connected.query('BEGIN');
    await connected.query('SELECT pg_advisory_xact_lock($1)', [913_700_321]);
    await connected.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(128) PRIMARY KEY,
      checksum CHAR(64) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    await connected.query('REVOKE ALL ON TABLE schema_migrations FROM orders_runtime');

    for (const file of files) {
      const sql = await readFile(join(sqlDirectory, file), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const existing = await connected.query<{ checksum: string }>(
        'SELECT checksum FROM schema_migrations WHERE version = $1',
        [file],
      );
      if ((existing.rowCount ?? 0) > 0) {
        if (existing.rows[0]?.checksum.trim() !== checksum) {
          throw new Error(`Migration checksum mismatch for ${file}.`);
        }
        continue;
      }
      await connected.query(sql);
      await connected.query('INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)', [
        file,
        checksum,
      ]);
      appliedCount += 1;
    }
    await connected.query('COMMIT');
    console.log(`Applied migrations: ${appliedCount}; verified: ${files.length - appliedCount}.`);
  } catch (error) {
    try {
      await client?.query('ROLLBACK');
    } catch {
      /* database may be disconnected */
    }
    const errorType = error instanceof Error ? error.name : typeof error;
    const sqlState =
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string' &&
      /^[A-Z0-9]{5}$/.test(error.code)
        ? error.code
        : 'unknown';
    console.error(`Database migration failed type=${errorType} sqlState=${sqlState}.`);
    throw error;
  } finally {
    client?.release();
    await pool.end();
  }
}
