import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateOrderCustomerDto } from './orders.dto.js';

export class ApiFieldErrorResponseDto {
  @ApiProperty({ example: 'items.0.productId' })
  field!: string;

  @ApiProperty({ example: 'PRODUCT_NOT_FOUND' })
  code!: string;

  @ApiProperty({ example: 'O produto não existe.' })
  message!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  productId?: string;
}

export class ProblemDetailsResponseDto {
  @ApiProperty({ example: 'about:blank' })
  type!: string;

  @ApiProperty({ example: 'Requisição inválida' })
  title!: string;

  @ApiProperty({ minimum: 400, maximum: 599, example: 400 })
  status!: number;

  @ApiProperty({ example: 'Um ou mais campos da requisição são inválidos.' })
  detail!: string;

  @ApiProperty({ example: '/api/v1/orders' })
  instance!: string;

  @ApiProperty({ example: 'VALIDATION_ERROR' })
  code!: string;

  @ApiProperty({ format: 'uuid' })
  traceId!: string;

  @ApiPropertyOptional({ type: ApiFieldErrorResponseDto, isArray: true })
  errors?: ApiFieldErrorResponseDto[];
}

export class DiscountPolicyResponseDto {
  @ApiProperty({ minLength: 1, maxLength: 64, example: 'volume-v1' })
  ruleId!: string;

  @ApiProperty({ example: true })
  enabled!: boolean;

  @ApiProperty({ minimum: 0, maximum: 1_000_000_000_000, example: 50_000 })
  thresholdCents!: number;

  @ApiProperty({ minimum: 0, maximum: 10_000, example: 1_000 })
  rateBps!: number;

  @ApiProperty({ enum: ['HALF_UP'], example: 'HALF_UP' })
  rounding!: 'HALF_UP';
}

export class DiscountResponseDto {
  @ApiProperty({ example: true })
  applied!: boolean;

  @ApiProperty({ minimum: 0, maximum: 1_000_000_000_000, example: 5_000 })
  amountCents!: number;

  @ApiProperty({ type: DiscountPolicyResponseDto })
  policy!: DiscountPolicyResponseDto;
}

export class OrderItemResponseDto {
  @ApiProperty({ minimum: 1, maximum: 100, example: 1 })
  lineNumber!: number;

  @ApiProperty({ format: 'uuid' })
  productId!: string;

  @ApiProperty({ minLength: 1, maxLength: 40, example: 'TEC-001' })
  sku!: string;

  @ApiProperty({ minLength: 1, maxLength: 120, example: 'Teclado' })
  productName!: string;

  @ApiProperty({ minimum: 1, maximum: 100_000_000, example: 20_000 })
  unitPriceCents!: number;

  @ApiProperty({ minimum: 1, maximum: 10_000, example: 2 })
  quantity!: number;

  @ApiProperty({ minimum: 1, maximum: 1_000_000_000_000, example: 40_000 })
  lineSubtotalCents!: number;

  @ApiProperty({ minimum: 1, maximum: 2_147_483_647, example: 3 })
  priceVersion!: number;

  @ApiProperty({ format: 'date-time', example: '2026-10-22T12:00:00Z' })
  productUpdatedAt!: string;
}

export class OrderResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: CreateOrderCustomerDto })
  customer!: CreateOrderCustomerDto;

  @ApiProperty({ type: OrderItemResponseDto, isArray: true, minItems: 1, maxItems: 100 })
  items!: OrderItemResponseDto[];

  @ApiProperty({ enum: ['BRL'], example: 'BRL' })
  currency!: 'BRL';

  @ApiProperty({ minimum: 1, maximum: 1_000_000_000_000, example: 50_000 })
  subtotalCents!: number;

  @ApiProperty({ type: DiscountResponseDto })
  discount!: DiscountResponseDto;

  @ApiProperty({ minimum: 0, maximum: 1_000_000_000_000, example: 45_000 })
  totalCents!: number;

  @ApiProperty({ enum: ['CREATED'], example: 'CREATED' })
  status!: 'CREATED';

  @ApiProperty({ format: 'date-time' })
  pricingObservedAt!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

export class OrderSummaryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: CreateOrderCustomerDto })
  customer!: CreateOrderCustomerDto;

  @ApiProperty({ enum: ['BRL'] })
  currency!: 'BRL';

  @ApiProperty({ minimum: 1, maximum: 1_000_000_000_000 })
  subtotalCents!: number;

  @ApiProperty({ minimum: 0, maximum: 1_000_000_000_000 })
  discountAmountCents!: number;

  @ApiProperty({ minimum: 0, maximum: 1_000_000_000_000 })
  totalCents!: number;

  @ApiProperty({ enum: ['CREATED'] })
  status!: 'CREATED';

  @ApiProperty({ minimum: 1, maximum: 100 })
  itemCount!: number;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

export class OrderPageMetaResponseDto {
  @ApiProperty({ minimum: 1, maximum: 1_000_000 })
  page!: number;

  @ApiProperty({ minimum: 1, maximum: 100 })
  pageSize!: number;

  @ApiProperty({ minimum: 0 })
  totalItems!: number;

  @ApiProperty({ minimum: 0 })
  totalPages!: number;
}

export class OrderPageResponseDto {
  @ApiProperty({ type: OrderSummaryResponseDto, isArray: true, maxItems: 100 })
  data!: OrderSummaryResponseDto[];

  @ApiProperty({ type: OrderPageMetaResponseDto })
  meta!: OrderPageMetaResponseDto;
}

export class HealthCheckItemResponseDto {
  @ApiProperty({ example: 'postgres' })
  name!: string;

  @ApiProperty({ enum: ['UP', 'DOWN'] })
  status!: 'UP' | 'DOWN';
}

export class HealthCheckResponseDto {
  @ApiProperty({ enum: ['UP', 'DOWN'] })
  status!: 'UP' | 'DOWN';

  @ApiProperty({ enum: ['orders'] })
  service!: 'orders';

  @ApiProperty({ type: HealthCheckItemResponseDto, isArray: true })
  checks!: HealthCheckItemResponseDto[];
}
