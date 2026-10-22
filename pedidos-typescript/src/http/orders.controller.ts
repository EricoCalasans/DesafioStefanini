import { Body, Controller, Get, Headers, Inject, Param, Post, Query, Res } from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiGatewayTimeoutResponse,
  ApiHeader,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiQuery,
  ApiResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
  ApiUnsupportedMediaTypeResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type { CreateOrderUseCase } from '../application/create-order.js';
import { ApplicationError } from '../application/errors.js';
import type { OrderRepository } from '../application/ports.js';
import { CREATE_ORDER_USE_CASE, ORDER_REPOSITORY } from '../application/ports.js';
import { presentOrder, presentOrderPage } from './order.presenter.js';
import { CreateOrderDto } from './orders.dto.js';
import {
  OrderPageResponseDto,
  OrderResponseDto,
  ProblemDetailsResponseDto,
} from './response.dto.js';

const ORDER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const DECIMAL = /^(0|[1-9][0-9]*)$/;

@Controller('orders')
@ApiTags('Orders')
@ApiHeader({
  name: 'X-Correlation-Id',
  required: false,
  description: 'UUID que será devolvido e propagado ao Catálogo.',
  schema: { type: 'string', format: 'uuid' },
})
export class OrdersController {
  constructor(
    @Inject(CREATE_ORDER_USE_CASE) private readonly createOrder: CreateOrderUseCase,
    @Inject(ORDER_REPOSITORY) private readonly repository: OrderRepository,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar pedido com preços atuais consultados em lote no Catálogo' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Pedido criado e confirmado no PostgreSQL.',
    type: OrderResponseDto,
    headers: {
      Location: { description: 'URI do pedido criado.', schema: { type: 'string' } },
      'X-Correlation-Id': {
        description: 'UUID de correlação.',
        schema: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiBadRequestResponse({ type: ProblemDetailsResponseDto })
  @ApiPayloadTooLargeResponse({ type: ProblemDetailsResponseDto })
  @ApiUnsupportedMediaTypeResponse({ type: ProblemDetailsResponseDto })
  @ApiUnprocessableEntityResponse({ type: ProblemDetailsResponseDto })
  @ApiBadGatewayResponse({ type: ProblemDetailsResponseDto })
  @ApiServiceUnavailableResponse({ type: ProblemDetailsResponseDto })
  @ApiGatewayTimeoutResponse({ type: ProblemDetailsResponseDto })
  @ApiInternalServerErrorResponse({ type: ProblemDetailsResponseDto })
  async create(
    @Body() body: CreateOrderDto,
    @Headers('x-correlation-id') correlationId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const order = await this.createOrder.execute({
      customer: { name: body.customer.name, email: body.customer.email },
      items: body.items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      correlationId,
    });
    response.status(201).setHeader('Location', `/api/v1/orders/${order.id}`);
    return presentOrder(order);
  }

  @Get()
  @ApiOperation({ summary: 'Listar resumos por data de criação decrescente e ID decrescente' })
  @ApiQuery({ name: 'page', required: false, type: Number, minimum: 1, maximum: 1_000_000 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, minimum: 1, maximum: 100 })
  @ApiOkResponse({ type: OrderPageResponseDto })
  @ApiBadRequestResponse({ type: ProblemDetailsResponseDto })
  @ApiServiceUnavailableResponse({ type: ProblemDetailsResponseDto })
  @ApiInternalServerErrorResponse({ type: ProblemDetailsResponseDto })
  async list(@Query() query: Record<string, string | undefined>) {
    const allowed = new Set(['page', 'pageSize']);
    const unknown = Object.keys(query).filter((key) => !allowed.has(key));
    if (unknown.length > 0) {
      throw new ApplicationError(
        400,
        'VALIDATION_ERROR',
        'Parâmetro inválido',
        'A consulta contém parâmetros não reconhecidos.',
        unknown.map((field) => ({
          field,
          code: 'UNKNOWN_QUERY_PARAMETER',
          message: 'Parâmetro não permitido.',
        })),
      );
    }
    const page = this.parsePage(query.page, 'page', 1, 1_000_000);
    const pageSize = this.parsePage(query.pageSize, 'pageSize', 20, 100);
    return presentOrderPage(await this.repository.list(page, pageSize));
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Consultar snapshot completo sem acessar o Catálogo' })
  @ApiOkResponse({ type: OrderResponseDto })
  @ApiBadRequestResponse({ type: ProblemDetailsResponseDto })
  @ApiNotFoundResponse({ type: ProblemDetailsResponseDto })
  @ApiServiceUnavailableResponse({ type: ProblemDetailsResponseDto })
  @ApiInternalServerErrorResponse({ type: ProblemDetailsResponseDto })
  async getById(@Param('orderId') orderId: string) {
    if (!ORDER_ID.test(orderId)) {
      throw new ApplicationError(
        400,
        'VALIDATION_ERROR',
        'Requisição inválida',
        'orderId deve ser um UUID canônico em letras minúsculas.',
        [{ field: 'orderId', code: 'INVALID_ORDER_ID', message: 'Informe um UUID válido.' }],
      );
    }
    const order = await this.repository.findById(orderId);
    if (!order) {
      throw new ApplicationError(
        404,
        'ORDER_NOT_FOUND',
        'Pedido não encontrado',
        'Não existe pedido com o identificador informado.',
      );
    }
    return presentOrder(order);
  }

  private parsePage(
    value: string | undefined,
    field: string,
    fallback: number,
    max: number,
  ): number {
    if (value === undefined) return fallback;
    if (!DECIMAL.test(value)) {
      throw new ApplicationError(
        400,
        'VALIDATION_ERROR',
        'Parâmetro inválido',
        `${field} deve ser um inteiro decimal dentro do intervalo permitido.`,
        [{ field, code: 'INVALID_QUERY_PARAMETER', message: 'Informe um inteiro decimal válido.' }],
      );
    }
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) {
      throw new ApplicationError(
        400,
        'VALIDATION_ERROR',
        'Parâmetro inválido',
        `${field} deve estar dentro do intervalo permitido.`,
        [
          {
            field,
            code: 'INVALID_QUERY_PARAMETER',
            message: 'Informe um valor dentro do intervalo permitido.',
          },
        ],
      );
    }
    return parsed;
  }
}
