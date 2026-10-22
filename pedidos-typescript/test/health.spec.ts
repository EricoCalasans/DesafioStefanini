import { RequestMethod } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Orders health endpoint', () => {
  it('returns liveness without depending on PostgreSQL or Catalog', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1', {
      exclude: [{ path: 'health/live', method: RequestMethod.GET }],
    });
    await app.init();

    try {
      const response = await request(app.getHttpServer()).get('/health/live').expect(200);
      expect(response.body).toEqual({ status: 'UP', service: 'orders', checks: [] });
    } finally {
      await app.close();
    }
  });
});
