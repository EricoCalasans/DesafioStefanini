import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Pool } from 'pg';
import { expect, it, vi } from 'vitest';
import { POOL } from '../src/adapters/postgres-order.repository.js';
import { AppModule } from '../src/app.module.js';

it('handles an idle PostgreSQL connection error without crashing or logging private details', async () => {
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
