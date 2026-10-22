import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import type { Response } from 'express';
import { type ApiFieldError, ApplicationError } from '../application/errors.js';
import type { CorrelatedRequest } from './correlation.middleware.js';

function flattenValidationErrors(errors: readonly ValidationError[], parent = ''): ApiFieldError[] {
  return errors.flatMap((error) => {
    const field = parent ? `${parent}.${error.property}` : error.property;
    const current = Object.keys(error.constraints ?? {}).map((constraint) => ({
      field,
      code: constraint === 'whitelistValidation' ? 'UNKNOWN_FIELD' : 'INVALID_FIELD',
      message:
        constraint === 'whitelistValidation'
          ? 'Campo não permitido.'
          : 'O valor informado é inválido.',
    }));
    return [...current, ...flattenValidationErrors(error.children ?? [], field)];
  });
}

export function validationException(errors: readonly ValidationError[]): ApplicationError {
  return new ApplicationError(
    400,
    'VALIDATION_ERROR',
    'Requisição inválida',
    'Um ou mais campos da requisição são inválidos.',
    flattenValidationErrors(errors),
  );
}

function titleFor(status: number): string {
  if (status === 404) return 'Recurso não encontrado';
  if (status === 413) return 'Requisição muito grande';
  if (status === 415) return 'Tipo de mídia não suportado';
  if (status === 422) return 'Regra de negócio não atendida';
  if (status === 503) return 'Serviço indisponível';
  if (status === 504) return 'Tempo limite excedido';
  return status >= 500 ? 'Erro interno' : 'Requisição inválida';
}

@Catch()
export class ProblemExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<CorrelatedRequest>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let title = titleFor(status);
    let detail = 'Não foi possível concluir a requisição.';
    let errors: readonly ApiFieldError[] | undefined;

    if (exception instanceof ApplicationError) {
      ({ status, code, title, detail, errors } = exception);
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      code =
        status === 413
          ? 'PAYLOAD_TOO_LARGE'
          : status === 415
            ? 'UNSUPPORTED_MEDIA_TYPE'
            : 'VALIDATION_ERROR';
      const message =
        typeof body === 'object' && body !== null && 'message' in body ? body.message : undefined;
      detail = Array.isArray(message)
        ? 'Um ou mais campos da requisição são inválidos.'
        : typeof message === 'string'
          ? message
          : titleFor(status);
      title = titleFor(status);
      if (status === 404) code = 'ORDER_NOT_FOUND';
    } else {
      this.logger.error(
        `Unhandled error type=${exception instanceof Error ? exception.name : typeof exception} traceId=${request.correlationId}`,
      );
    }

    response
      .status(status)
      .type('application/problem+json')
      .json({
        type: 'about:blank',
        title,
        status,
        detail,
        instance: request.path,
        code,
        traceId: request.correlationId,
        ...(errors && errors.length > 0 ? { errors } : {}),
      });
  }
}
