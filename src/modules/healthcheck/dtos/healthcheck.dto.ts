import { ApiProperty, PickType } from '@nestjs/swagger';
import { ServiceDto } from '../../dtos/services.dto';

export class ServiceHealthDto extends PickType(ServiceDto, ['name']) {
  @ApiProperty({
    description: 'Service status',
    required: true,
    type: 'string',
    example: 'healthy',
  })
  status: string;
}

export class HealthcheckDto {
  @ApiProperty({
    description: 'Response message',
    required: true,
    type: 'string',
    example: {
      message: 'All services are healthy',
    },
  })
  readonly message: string;

  @ApiProperty({
    description: 'Response status',
    required: true,
    type: 'number',
    example: [
      {
        name: 'RabbitMQClient',
        status: 'healthy',
      },
    ],
  })
  readonly services: ServiceHealthDto[];
}
