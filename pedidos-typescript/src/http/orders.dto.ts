import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsObject,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidateNested,
  type ValidationArguments,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { containsAsciiControlCharacter } from '../domain/text-validation.js';

@ValidatorConstraint({ name: 'codePointLength', async: false })
class CodePointLengthConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args?: ValidationArguments): boolean {
    const maximum = args?.constraints[0];
    return typeof value === 'string' && typeof maximum === 'number' && [...value].length <= maximum;
  }
}

@ValidatorConstraint({ name: 'printableText', async: false })
class PrintableTextConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && !containsAsciiControlCharacter(value);
  }
}

@ValidatorConstraint({ name: 'asciiEmail', async: false })
class AsciiEmailConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && /^[\x21-\x7e]+$/.test(value);
  }
}

export class CreateOrderCustomerDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Validate(CodePointLengthConstraint, [120])
  @Validate(PrintableTextConstraint)
  @Matches(/\S/u)
  @ApiProperty({ minLength: 1, maxLength: 120, example: 'Cliente Exemplo' })
  name!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(254)
  @Validate(CodePointLengthConstraint, [254])
  @Validate(AsciiEmailConstraint)
  @IsEmail({ allow_utf8_local_part: false })
  @ApiProperty({ format: 'email', minLength: 3, maxLength: 254, example: 'cliente@example.com' })
  email!: string;
}

export class CreateOrderItemDto {
  @IsString()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u)
  @ApiProperty({ format: 'uuid', example: '11111111-1111-4111-8111-111111111111' })
  productId!: string;

  @IsInt()
  @Min(1)
  @Max(10_000)
  @ApiProperty({ type: 'integer', minimum: 1, maximum: 10_000, example: 2 })
  quantity!: number;
}

export class CreateOrderDto {
  @IsObject()
  @ValidateNested()
  @Type(() => CreateOrderCustomerDto)
  @ApiProperty({ type: CreateOrderCustomerDto })
  customer!: CreateOrderCustomerDto;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @ApiProperty({ type: CreateOrderItemDto, isArray: true, minItems: 1, maxItems: 100 })
  items!: CreateOrderItemDto[];
}
