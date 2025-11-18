import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RabbitMQClient } from 'rabbitmq-client-ts';
import { HealthcheckService } from '../healthcheck/healthcheck.service';
import { ErrorHandlerService } from '../../services/error.handler.service';
import { SERVICES } from '../dtos';
import { isGenericError } from '../../utils';
import { CURRENT_API_VERSION } from '../../config/configuration';
import { OrderDto, SalesOrderSyncResponseDto } from './dtos';
import { OrderEntity } from './entities/order.entity';

@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,
    private readonly healthcheckService: HealthcheckService,
    @Inject(RabbitMQClient)
    private readonly rabbitMQClient: RabbitMQClient,
    private readonly configService: ConfigService,
    @Inject(ErrorHandlerService)
    private readonly errorHandlerService: ErrorHandlerService,
  ) {}

  async onModuleInit() {
    await this.initializeRabbitMQClient();
  }

  async findAllForCustomer(customerId: string): Promise<OrderEntity[]> {
    return this.ordersRepository.find({ where: { customerId } });
  }

  async findOne(id: number): Promise<OrderEntity | null> {
    return this.ordersRepository.findOne({ where: { id } });
  }

  async syncSalesOrderFromOperation(
    salesOrder: OrderDto,
    customerId: string,
  ): Promise<SalesOrderSyncResponseDto> {
    try {
      if (!this.healthcheckService.getServiceHealth(SERVICES.RabbitMQClient)) {
        await this.initializeRabbitMQClient();
      }

      console.log(
        'Sending sales order to RabbitMQ from OrdersService:',
        salesOrder.orderNumber,
      );

      const response = await this.rabbitMQClient.rpcProducer({
        messageOptions: {
          exchange: this.configService.get(
            'rabbitmq.options.salesOrderSync.exchange',
          ),
          routingKey: this.configService.get(
            'rabbitmq.options.salesOrderSync.routingKey',
          ),
          payload: salesOrder,
        },
        validationOptions: {
          request: {
            classType: OrderDto,
          },
          response: {
            classType: SalesOrderSyncResponseDto,
          },
        },
        opts: {
          headers: {
            'X-API-Version': CURRENT_API_VERSION,
          },
        },
      });

      const orderEntity = this.ordersRepository.create({
        customerId,
        orderNumber: salesOrder.orderNumber,
        status: 'SYNCED_FROM_OPERATION',
        totalAmount: salesOrder.totalAmount,
      });

      await this.ordersRepository.save(orderEntity);

      console.log(
        'Sales order synced via RabbitMQ and stored in DB with id:',
        orderEntity.id,
      );

      return response;
    } catch (error) {
      console.error(
        'Error received while syncing sales order from Operation:',
        error,
      );

      if (isGenericError(error)) {
        throw error;
      }

      // Fallback for errors coming from downstream HTTP clients etc.
      throw error.response?.data ?? error;
    }
  }

  private async initializeRabbitMQClient() {
    try {
      await this.rabbitMQClient.initialize(
        this.configService.get('rabbitmq.client.vhost'),
      );

      this.rabbitMQClient.on('ready', async () => {
        await this.rabbitMQClient.setupQueue(
          this.configService.get('rabbitmq.options.salesOrderSync.exchange'),
          this.configService.get('rabbitmq.options.salesOrderSync.routingKey'),
        );
        this.healthcheckService.setServiceHealth(SERVICES.RabbitMQClient, true);
      });

      this.rabbitMQClient.on('closed', () => {
        this.healthcheckService.setServiceHealth(
          SERVICES.RabbitMQClient,
          false,
        );
        console.error('RabbitMQ Client connection is closed');
      });
    } catch (error) {
      this.healthcheckService.setServiceHealth(SERVICES.RabbitMQClient, false);
      const handledError = this.errorHandlerService.handleError(error);
      console.error('Error initializing rabbitmq client', handledError);
    }
  }
}
