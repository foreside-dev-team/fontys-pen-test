import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Scopes } from '../../decorators/scopes.decorator';
import { ScopesGuard } from '../../guards/scopes.guard';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import {
  Error400Dto,
  Error401Dto,
  Error403Dto,
  Error500Dto,
} from '../../middlewares/dtos/error.dto';
import { OrderDto, SalesOrderSyncResponseDto } from './dtos';
import { OrdersService } from './orders.service';
import { plainToInstance } from 'class-transformer';

@ApiTags('Orders')
@ApiBearerAuth('bearer')
@Controller('orders')
@UseGuards(JwtAuthGuard, ScopesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Scopes('sales_orders.sync')
  @ApiOperation({
    summary: 'List orders for the current user',
    description:
      'Returns only the orders that belong to the authenticated user (by customerId).',
  })
  async findAll(@Req() req: Request): Promise<OrderDto[]> {
    const user = req.user as { sub?: string } | undefined;
    const customerId = user?.sub;
    return plainToInstance(
      OrderDto,
      await this.ordersService.findAllForCustomer(customerId ?? ''),
    );
  }

  @Post('operation/sync')
  @Scopes('sales_orders.sync')
  @ApiOperation({
    summary: 'Sync sales order from Operation via RabbitMQ',
    description:
      'Receives a sales order payload from the external Operation/CRM system, forwards it over RabbitMQ, and stores a simplified copy in the Orders database for the current user.',
  })
  @ApiResponse({
    type: SalesOrderSyncResponseDto,
    description: 'Sales order synced successfully',
    status: 201,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
    type: Error400Dto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: Error401Dto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
    type: Error403Dto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: Error500Dto,
  })
  async syncSalesOrderFromOperation(
    @Req() req: Request,
    @Body() salesOrder: OrderDto,
  ): Promise<SalesOrderSyncResponseDto> {
    const user = req.user as { sub?: string } | undefined;
    const customerId = user?.sub ?? '';
    return this.ordersService.syncSalesOrderFromOperation(
      salesOrder,
      customerId,
    );
  }

  @Get(':id')
  @Scopes('sales_orders.sync')
  @ApiOperation({
    summary: 'Get order by id',
    description: 'Returns an order by id',
  })
  async findOne(@Param('id') id: number) {
    return this.ordersService.findOne(id);
  }
}
