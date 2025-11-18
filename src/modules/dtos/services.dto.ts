import { ApiProperty } from '@nestjs/swagger';

export enum SERVICES {
  RabbitMQClient = 'RabbitMQClient',
}

export class ServiceDto {
  @ApiProperty({
    description: 'Name of the service',
    required: true,
    maxLength: 100,
    example: 'RabbitMQClient',
  })
  name: SERVICES;
}
