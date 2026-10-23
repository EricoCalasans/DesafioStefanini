import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger, Module, type OnApplicationShutdown } from '@nestjs/common';
import type { Pool as PgPool } from 'pg';
import { Pool } from 'pg';
import { CatalogHttpClient } from './adapters/catalog-http.client.js';
import { POOL, PostgresOrderRepository } from './adapters/postgres-order.repository.js';
import { CreateOrderUseCase } from './application/create-order.js';
import type { CatalogClient, Clock, OrderRepository, UuidGenerator } from './application/ports.js';
import {
  CATALOG_CLIENT,
  CLOCK,
  CREATE_ORDER_USE_CASE,
  ORDER_REPOSITORY,
  ORDERS_CONFIGURATION,
  UUID_GENERATOR,
} from './application/ports.js';
import type { OrdersConfiguration } from './bootstrap/configuration.js';
import { loadOrdersConfiguration } from './bootstrap/configuration.js';
import { HealthController } from './health/health.controller.js';
import { OrdersController } from './http/orders.controller.js';

@Injectable()
class PostgresPoolLifecycle implements OnApplicationShutdown {
  constructor(@Inject(POOL) private readonly pool: PgPool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}

@Module({
  controllers: [HealthController, OrdersController],
  providers: [
    { provide: ORDERS_CONFIGURATION, useFactory: () => loadOrdersConfiguration(process.env) },
    {
      provide: POOL,
      useFactory: (configuration: OrdersConfiguration) => {
        const pool = new Pool({
          connectionString: configuration.databaseUrl,
          max: 10,
          connectionTimeoutMillis: 1_000,
          idleTimeoutMillis: 10_000,
          options: '-c statement_timeout=2000 -c lock_timeout=1000',
        });
        pool.on('error', () => {
          new Logger('PostgresPool').error(
            'Idle PostgreSQL connection lost; pool remains available.',
          );
        });
        return pool;
      },
      inject: [ORDERS_CONFIGURATION],
    },
    PostgresPoolLifecycle,
    PostgresOrderRepository,
    { provide: ORDER_REPOSITORY, useExisting: PostgresOrderRepository },
    CatalogHttpClient,
    { provide: CATALOG_CLIENT, useExisting: CatalogHttpClient },
    { provide: CLOCK, useValue: Object.freeze({ now: () => new Date() }) satisfies Clock },
    {
      provide: UUID_GENERATOR,
      useValue: Object.freeze({ generate: randomUUID }) satisfies UuidGenerator,
    },
    {
      provide: CREATE_ORDER_USE_CASE,
      useFactory: (
        catalog: CatalogClient,
        repository: OrderRepository,
        configuration: OrdersConfiguration,
        clock: Clock,
        uuidGenerator: UuidGenerator,
      ) =>
        new CreateOrderUseCase({
          catalog,
          repository,
          policy: configuration.discount,
          clock,
          uuidGenerator,
        }),
      inject: [CATALOG_CLIENT, ORDER_REPOSITORY, ORDERS_CONFIGURATION, CLOCK, UUID_GENERATOR],
    },
  ],
})
export class AppModule {}
