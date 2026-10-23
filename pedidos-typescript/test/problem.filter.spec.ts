import { type ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { describe, expect, it, vi } from 'vitest';
import { ApplicationError, validationError } from '../src/application/errors.js';
import { ProblemExceptionFilter, validationException } from '../src/http/problem.filter.js';

const correlationId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function catchException(exception: unknown) {
  const responseState: { status?: number; contentType?: string; body?: unknown } = {};
  const response = {
    status(status: number) {
      responseState.status = status;
      return this;
    },
    type(contentType: string) {
      responseState.contentType = contentType;
      return this;
    },
    json(body: unknown) {
      responseState.body = body;
      return this;
    },
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ path: '/api/v1/orders', correlationId }),
    }),
  } as unknown as ArgumentsHost;

  new ProblemExceptionFilter().catch(exception, host);
  return responseState;
}

describe('validationException', () => {
  it('creates a typed validation error with optional field details', () => {
    const error = validationError('Entrada inválida.', [
      { field: 'items', code: 'REQUIRED', message: 'Informe ao menos um item.' },
    ]);

    expect(error).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      detail: 'Entrada inválida.',
      errors: [{ field: 'items', code: 'REQUIRED' }],
    });
    expect(validationError('Entrada inválida.').errors).toEqual([]);
  });

  it('flattens nested constraints and distinguishes unknown fields', () => {
    const errors = [
      {
        property: 'customer',
        constraints: { isObject: 'isObject' },
        children: [{ property: 'name', constraints: { matches: 'matches' }, children: [] }],
      },
      {
        property: 'extra',
        constraints: { whitelistValidation: 'whitelistValidation' },
        children: [],
      },
    ] as ValidationError[];

    const result = validationException(errors);

    expect(result).toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
    expect(result.errors).toEqual([
      { field: 'customer', code: 'INVALID_FIELD', message: 'O valor informado é inválido.' },
      {
        field: 'customer.name',
        code: 'INVALID_FIELD',
        message: 'O valor informado é inválido.',
      },
      { field: 'extra', code: 'UNKNOWN_FIELD', message: 'Campo não permitido.' },
    ]);
  });

  it('returns an empty error list when the validation pipe has no details', () => {
    expect(validationException([]).errors).toEqual([]);
  });
});

describe('ProblemExceptionFilter', () => {
  it('preserves typed application errors and omits an empty details array', () => {
    const state = catchException(
      new ApplicationError(
        422,
        'PRODUCTS_NOT_ORDERABLE',
        'Produtos indisponíveis',
        'Regra aplicada.',
        [],
      ),
    );

    expect(state.status).toBe(422);
    expect(state.contentType).toBe('application/problem+json');
    expect(state.body).toEqual({
      type: 'about:blank',
      title: 'Produtos indisponíveis',
      status: 422,
      detail: 'Regra aplicada.',
      instance: '/api/v1/orders',
      code: 'PRODUCTS_NOT_ORDERABLE',
      traceId: correlationId,
    });
  });

  it.each([
    [400, 'Requisição inválida', 'VALIDATION_ERROR', 'Mensagem de validação.'],
    [404, 'Recurso não encontrado', 'ORDER_NOT_FOUND', 'Mensagem de ausência.'],
    [
      413,
      'Requisição muito grande',
      'PAYLOAD_TOO_LARGE',
      'Um ou mais campos da requisição são inválidos.',
    ],
    [415, 'Tipo de mídia não suportado', 'UNSUPPORTED_MEDIA_TYPE', 'Mensagem de mídia.'],
    [422, 'Regra de negócio não atendida', 'VALIDATION_ERROR', 'Mensagem de validação.'],
    [503, 'Serviço indisponível', 'VALIDATION_ERROR', 'Mensagem de disponibilidade.'],
    [
      504,
      'Tempo limite excedido',
      'VALIDATION_ERROR',
      'Um ou mais campos da requisição são inválidos.',
    ],
  ])('maps Nest HTTP status %s to stable problem details', (status, title, code, detail) => {
    const body =
      status === 413 || status === 504
        ? { message: ['constraint'] }
        : {
            message:
              status === 400
                ? 'Mensagem de validação.'
                : status === 404
                  ? 'Mensagem de ausência.'
                  : status === 415
                    ? 'Mensagem de mídia.'
                    : status === 422
                      ? 'Mensagem de validação.'
                      : status === 503
                        ? 'Mensagem de disponibilidade.'
                        : 'unexpected',
          };
    const state = catchException(new HttpException(body, status));

    expect(state.status).toBe(status);
    expect(state.contentType).toBe('application/problem+json');
    expect(state.body).toMatchObject({
      status,
      title,
      code,
      detail,
      traceId: correlationId,
    });
  });

  it('sanitizes unexpected exceptions and logs only their type and correlation', () => {
    const log = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    try {
      const state = catchException(new Error('database password=private'));
      expect(state.body).toMatchObject({
        status: 500,
        title: 'Erro interno',
        code: 'INTERNAL_ERROR',
        detail: 'Não foi possível concluir a requisição.',
      });
      expect(JSON.stringify(state.body)).not.toContain('private');
      expect(log).toHaveBeenCalledWith(`Unhandled error type=Error traceId=${correlationId}`);
    } finally {
      log.mockRestore();
    }
  });
});
