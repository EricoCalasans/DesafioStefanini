import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Pool } from 'pg';
import { expect, it, vi } from 'vitest';

it('handles an idle PostgreSQL connection error without crashing or logging private details', async () => {
  const { AppModule } = await import(new URL('../dist/app.module.js', import.meta.url).href);
  const { POOL } = await import(
    new URL('../dist/adapters/postgres-order.repository.js', import.meta.url).href
  );
  const log = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  try {
    const pool = module.get<Pool>(POOL);
    expect(() => pool.emit('error', new Error('private connection detail'))).not.toThrow();
    expect(log).toHaveBeenCalled();
    expect(JSON.stringify(log.mock.calls)).not.toContain('private connection detail');
  } finally {
    await module.close();
  }
});
