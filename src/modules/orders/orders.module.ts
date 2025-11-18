import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { OrderEntity } from './entities/order.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';
import { HealthcheckModule } from '../healthcheck/healthcheck.module';
import { ErrorHandlerService } from '../../services/error.handler.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity]),
    ConfigModule,
    RabbitmqModule,
    HealthcheckModule,
  ],
  providers: [OrdersService, ErrorHandlerService],
  controllers: [OrdersController],
})
export class OrdersModule {}
