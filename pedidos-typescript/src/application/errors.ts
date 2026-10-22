export interface ApiFieldError {
  readonly field: string;
  readonly code: string;
  readonly message: string;
  readonly productId?: string;
}

export class ApplicationError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly title: string,
    readonly detail: string,
    readonly errors?: readonly ApiFieldError[],
  ) {
    super(detail);
    this.name = 'ApplicationError';
  }
}

export function validationError(
  detail: string,
  errors: readonly ApiFieldError[] = [],
): ApplicationError {
  return new ApplicationError(400, 'VALIDATION_ERROR', 'Requisição inválida', detail, errors);
}
