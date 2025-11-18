import { Module } from '@nestjs/common';
import { HealthcheckController } from './healthcheck.controller';
import { HealthcheckService } from './healthcheck.service';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, RabbitmqModule],
  controllers: [HealthcheckController],
  providers: [HealthcheckService],
  exports: [HealthcheckService],
})
export class HealthcheckModule {}
