import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CorrelatedRequest extends Request {
  correlationId: string;
}

export function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const rawHeader = req.header('x-correlation-id');
  const correlationId =
    rawHeader && UUID_PATTERN.test(rawHeader) ? rawHeader.toLowerCase() : randomUUID();
  (req as CorrelatedRequest).correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);
  next();
}
