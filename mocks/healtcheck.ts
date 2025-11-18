import { HealthcheckDto } from 'src/modules/healthcheck/dtos';
import { SERVICES } from '../src/modules/dtos';

export const mockHealthcheck: HealthcheckDto = {
  message: 'All services are healthy',
  services: [
    {
      name: SERVICES.RabbitMQClient,
      status: 'healthy',
    },
  ],
};
