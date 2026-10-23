import { RequestMethod } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { ORDER_REPOSITORY } from '../src/application/ports.js';

describe('Orders health endpoint', () => {
  async function createApplication(checkReady: () => Promise<void>) {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ORDER_REPOSITORY)
      .useValue({ checkReady })
      .compile();
    const app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1', {
      exclude: [
        { path: 'health/live', method: RequestMethod.GET },
        { path: 'health/ready', method: RequestMethod.GET },
      ],
    });
    await app.init();
    return app;
  }

  it('returns liveness without checking PostgreSQL or Catalog', async () => {
    const checkReady = vi.fn(async () => undefined);
    const app = await createApplication(checkReady);

    try {
      const response = await request(app.getHttpServer()).get('/health/live').expect(200);
      expect(response.body).toEqual({ status: 'UP', service: 'orders', checks: [] });
      expect(checkReady).not.toHaveBeenCalled();
    } finally {
      await app.close();
    }
  });

  it('reports PostgreSQL readiness when the repository is available', async () => {
    const checkReady = vi.fn(async () => undefined);
    const app = await createApplication(checkReady);

    try {
      const response = await request(app.getHttpServer()).get('/health/ready').expect(200);
      expect(response.body).toEqual({
        status: 'UP',
        service: 'orders',
        checks: [{ name: 'postgres', status: 'UP' }],
      });
      expect(checkReady).toHaveBeenCalledOnce();
    } finally {
      await app.close();
    }
  });

  it('reports PostgreSQL readiness as down when the repository check fails', async () => {
    const checkReady = vi.fn(async () => {
      throw new Error('synthetic database error');
    });
    const app = await createApplication(checkReady);

    try {
      const response = await request(app.getHttpServer()).get('/health/ready').expect(503);
      expect(response.body).toEqual({
        status: 'DOWN',
        service: 'orders',
        checks: [{ name: 'postgres', status: 'DOWN' }],
      });
      expect(checkReady).toHaveBeenCalledOnce();
    } finally {
      await app.close();
    }
  });
});
