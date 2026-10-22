import 'reflect-metadata';
import { RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: 'health/live', method: RequestMethod.GET }],
  });
  app.enableShutdownHooks();
  const port = Number(process.env.ORDERS_PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
