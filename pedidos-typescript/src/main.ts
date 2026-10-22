import 'reflect-metadata';
import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import express, {
  type ErrorRequestHandler,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import { AppModule } from './app.module.js';
import { ORDERS_CONFIGURATION } from './application/ports.js';
import type { OrdersConfiguration } from './bootstrap/configuration.js';
import { type CorrelatedRequest, correlationMiddleware } from './http/correlation.middleware.js';
import { ProblemExceptionFilter, validationException } from './http/problem.filter.js';

const BODY_LIMIT_BYTES = 65_536;

function problem(
  res: Response,
  req: Request,
  status: number,
  code: string,
  title: string,
  detail: string,
): void {
  const request = req as CorrelatedRequest;
  res.status(status).type('application/problem+json').json({
    type: 'about:blank',
    title,
    status,
    detail,
    instance: req.path,
    code,
    traceId: request.correlationId,
  });
}

const parserErrorHandler: ErrorRequestHandler = (error: unknown, req, res, next) => {
  if (res.headersSent) return next(error);
  const type =
    typeof error === 'object' && error !== null && 'type' in error ? error.type : undefined;
  if (type === 'entity.too.large') {
    problem(
      res,
      req,
      413,
      'PAYLOAD_TOO_LARGE',
      'Requisição muito grande',
      'O corpo excede o limite de 64 KiB.',
    );
    return;
  }
  if (type === 'entity.parse.failed') {
    problem(
      res,
      req,
      400,
      'INVALID_JSON',
      'JSON inválido',
      'O corpo da requisição não contém JSON válido.',
    );
    return;
  }
  problem(
    res,
    req,
    500,
    'INTERNAL_ERROR',
    'Erro interno',
    'Não foi possível concluir a requisição.',
  );
};

function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startedAt = performance.now();
  res.on('finish', () => {
    const request = req as CorrelatedRequest;
    new Logger('HttpRequest').log(
      JSON.stringify({
        service: 'orders',
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
        correlationId: request.correlationId,
      }),
    );
  });
  next();
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: 'health/live', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
    ],
  });
  app.use(correlationMiddleware);
  app.use(requestLoggingMiddleware);
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'POST' && req.path === '/api/v1/orders') {
      const mediaType = req.header('content-type')?.split(';', 2)[0]?.trim().toLowerCase();
      if (mediaType !== 'application/json') {
        problem(
          res,
          req,
          415,
          'UNSUPPORTED_MEDIA_TYPE',
          'Tipo de mídia não suportado',
          'Use Content-Type application/json.',
        );
        return;
      }
      const length = req.header('content-length');
      if (length && /^\d+$/.test(length) && Number(length) > BODY_LIMIT_BYTES) {
        problem(
          res,
          req,
          413,
          'PAYLOAD_TOO_LARGE',
          'Requisição muito grande',
          'O corpo excede o limite de 64 KiB.',
        );
        return;
      }
    }
    next();
  });
  app.use(express.json({ limit: BODY_LIMIT_BYTES, type: 'application/json' }));
  app.use(parserErrorHandler);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transformOptions: { enableImplicitConversion: false },
      exceptionFactory: validationException,
    }),
  );
  app.useGlobalFilters(new ProblemExceptionFilter());
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pedidos - Desafio COE Leader')
    .setDescription('Pedidos persistidos em PostgreSQL com preços consultados no serviço Catálogo.')
    .setVersion('1.0.0')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  app.enableShutdownHooks();
  const configuration = app.get<OrdersConfiguration>(ORDERS_CONFIGURATION);
  await app.listen(configuration.port, '0.0.0.0');
}

void bootstrap();
