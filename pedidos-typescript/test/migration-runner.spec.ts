import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Pool } from 'pg';
import { afterEach, expect, it, vi } from 'vitest';
import { runMigrations } from '../src/migrations/runner.js';

type FakeResult = { rowCount: number | null; rows: Array<{ checksum?: string }> };
type QueryHandler = (sql: string, values?: readonly unknown[]) => FakeResult | Promise<FakeResult>;

function fakePool(onQuery: QueryHandler = () => ({ rowCount: 0, rows: [] })) {
  const client = {
    query: vi.fn(async (sql: string, values?: readonly unknown[]) => onQuery(sql, values)),
    release: vi.fn(),
  };
  const pool = {
    connect: vi.fn(async () => client),
    end: vi.fn(async () => undefined),
  };
  return { client, pool: pool as unknown as Pool, mockPool: pool };
}

async function withMigrationFiles(
  files: Record<string, string>,
  action: (directory: string) => Promise<void>,
): Promise<void> {
  const directory = await mkdtemp(join(tmpdir(), 'orders-migrations-'));
  try {
    await Promise.all(
      Object.entries(files).map(([name, contents]) => writeFile(join(directory, name), contents)),
    );
    await action(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

afterEach(() => {
  vi.restoreAllMocks();
});

it('applies pending migrations in order, verifies existing checksums, and ignores non-migration files', async () => {
  await withMigrationFiles(
    {
      '001_initial.sql': 'SELECT 1;',
      '002_next.sql': 'SELECT 2;',
      '003_Uppercase.sql': 'SELECT 3;',
      'notes.txt': 'not SQL',
    },
    async (directory) => {
      const checksums = new Map([
        ['001_initial.sql', createHash('sha256').update('SELECT 1;').digest('hex')],
      ]);
      const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      const { client, pool } = fakePool((sql, values) => {
        if (sql.startsWith('SELECT checksum FROM schema_migrations')) {
          const checksum = checksums.get(String(values?.[0]));
          return { rowCount: checksum ? 1 : null, rows: checksum ? [{ checksum }] : [] };
        }
        if (sql.startsWith('INSERT INTO schema_migrations')) {
          checksums.set(String(values?.[0]), String(values?.[1]));
          return { rowCount: 1, rows: [] };
        }
        return { rowCount: null, rows: [] };
      });

      await runMigrations(pool, directory);

      expect(client.query).toHaveBeenCalledWith(
        'SELECT checksum FROM schema_migrations WHERE version = $1',
        ['001_initial.sql'],
      );
      expect(client.query).toHaveBeenCalledWith(
        'SELECT checksum FROM schema_migrations WHERE version = $1',
        ['002_next.sql'],
      );
      expect(client.query).not.toHaveBeenCalledWith('SELECT 1;');
      expect(client.query).toHaveBeenCalledWith('SELECT 2;');
      expect(client.query).not.toHaveBeenCalledWith('SELECT 3;');
      expect(client.query).toHaveBeenCalledWith(
        'INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)',
        ['002_next.sql', createHash('sha256').update('SELECT 2;').digest('hex')],
      );
      expect(log).toHaveBeenCalledWith('Applied migrations: 1; verified: 1.');
      expect(client.query).toHaveBeenCalledWith('COMMIT');
      expect(client.release).toHaveBeenCalledOnce();
      expect(pool.end).toHaveBeenCalledOnce();
    },
  );
});

it('rejects a changed migration checksum and rolls back the transaction', async () => {
  await withMigrationFiles({ '001_initial.sql': 'SELECT 1;' }, async (directory) => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { client, pool } = fakePool((sql) =>
      sql.startsWith('SELECT checksum FROM schema_migrations')
        ? { rowCount: 1, rows: [{ checksum: 'changed' }] }
        : { rowCount: null, rows: [] },
    );

    await expect(runMigrations(pool, directory)).rejects.toThrow(
      'Migration checksum mismatch for 001_initial.sql.',
    );

    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.query).not.toHaveBeenCalledWith('COMMIT');
    expect(errorLog).toHaveBeenCalledWith('Database migration failed type=Error sqlState=unknown.');
    expect(client.release).toHaveBeenCalledOnce();
    expect(pool.end).toHaveBeenCalledOnce();
  });
});

it('rethrows migration failures without logging SQL or secrets and tolerates rollback failure', async () => {
  await withMigrationFiles({ '001_broken.sql': 'SELECT broken;' }, async (directory) => {
    const databaseError = Object.assign(new Error('private database details'), { code: 'P0001' });
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { client, pool } = fakePool((sql) => {
      if (sql.startsWith('SELECT checksum FROM schema_migrations')) {
        return { rowCount: 0, rows: [] };
      }
      if (sql === 'SELECT broken;') throw databaseError;
      if (sql === 'ROLLBACK') throw new Error('private rollback details');
      return { rowCount: null, rows: [] };
    });

    await expect(runMigrations(pool, directory)).rejects.toBe(databaseError);

    expect(errorLog).toHaveBeenCalledWith('Database migration failed type=Error sqlState=P0001.');
    expect(errorLog.mock.calls.flat().join(' ')).not.toContain('private');
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalledOnce();
    expect(pool.end).toHaveBeenCalledOnce();
  });
});

it('closes the pool and logs a sanitized error when connection acquisition fails', async () => {
  await withMigrationFiles({ '001_initial.sql': 'SELECT 1;' }, async (directory) => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { client, pool, mockPool } = fakePool();
    const connectionError = 'private connection details';
    mockPool.connect.mockRejectedValue(connectionError);

    await expect(runMigrations(pool, directory)).rejects.toBe(connectionError);

    expect(errorLog).toHaveBeenCalledWith(
      'Database migration failed type=string sqlState=unknown.',
    );
    expect(errorLog.mock.calls.flat().join(' ')).not.toContain('private');
    expect(client.query).not.toHaveBeenCalled();
    expect(client.release).not.toHaveBeenCalled();
    expect(pool.end).toHaveBeenCalledOnce();
  });
});

it('commits an empty migration directory and reports zero applied files', async () => {
  await withMigrationFiles({}, async (directory) => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const { client, pool } = fakePool();

    await runMigrations(pool, directory);

    expect(client.query).toHaveBeenCalledWith('COMMIT');
    expect(log).toHaveBeenCalledWith('Applied migrations: 0; verified: 0.');
    expect(client.release).toHaveBeenCalledOnce();
    expect(pool.end).toHaveBeenCalledOnce();
  });
});
