import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitMQClient } from 'rabbitmq-client-ts';
import { IRabbitMQConfig } from '../../config/configuration';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: RabbitMQClient,
      useFactory: (configService: ConfigService) => {
        const rabbitmqConfig = configService.get<IRabbitMQConfig>('rabbitmq');
        if (!rabbitmqConfig?.client) {
          throw new Error('RabbitMQ client configuration not found');
        }

        return new RabbitMQClient(rabbitmqConfig.client);
      },
      inject: [ConfigService],
    },
  ],
  exports: [RabbitMQClient],
})
export class RabbitmqModule {}
