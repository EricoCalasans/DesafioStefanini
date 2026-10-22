import { Controller, Get, Inject, Res } from '@nestjs/common';
import {
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type { OrderRepository } from '../application/ports.js';
import { ORDER_REPOSITORY } from '../application/ports.js';
import { HealthCheckResponseDto } from '../http/response.dto.js';

@Controller('health')
@ApiTags('Operations')
@ApiHeader({
  name: 'X-Correlation-Id',
  required: false,
  schema: { type: 'string', format: 'uuid' },
})
export class HealthController {
  constructor(@Inject(ORDER_REPOSITORY) private readonly repository: OrderRepository) {}

  @Get('live')
  @ApiOperation({ summary: 'Verificar que o processo está ativo' })
  @ApiOkResponse({ type: HealthCheckResponseDto })
  live() {
    return { status: 'UP', service: 'orders', checks: [] } as const;
  }

  @Get('ready')
  @ApiOperation({ summary: 'Verificar a conexão com PostgreSQL' })
  @ApiOkResponse({ type: HealthCheckResponseDto })
  @ApiServiceUnavailableResponse({ type: HealthCheckResponseDto })
  async ready(@Res({ passthrough: true }) response: Response) {
    try {
      await this.repository.checkReady();
      return {
        status: 'UP',
        service: 'orders',
        checks: [{ name: 'postgres', status: 'UP' }],
      } as const;
    } catch {
      response.status(503);
      return {
        status: 'DOWN',
        service: 'orders',
        checks: [{ name: 'postgres', status: 'DOWN' }],
      } as const;
    }
  }
}
