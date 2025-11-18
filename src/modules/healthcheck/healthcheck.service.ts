import { Injectable } from '@nestjs/common';
import { HealthcheckDto, ServiceHealthDto } from './dtos';
import { SERVICES } from '../dtos';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class HealthcheckService {
  constructor(private readonly configService: ConfigService) {}
  private serviceHealths: ServiceHealthDto[] = [];

  getServiceHealth(serviceName: string): ServiceHealthDto {
    return this.serviceHealths.find((service) => service.name === serviceName);
  }

  setServiceHealth(serviceName: string, isHealthy: boolean): void {
    const serviceIndex = this.serviceHealths.findIndex(
      (service) => service.name === serviceName,
    );
    if (serviceIndex !== -1) {
      this.serviceHealths[serviceIndex].status = isHealthy
        ? 'healthy'
        : 'unhealthy';
    } else {
      this.serviceHealths.push({
        name: SERVICES[serviceName],
        status: isHealthy ? 'healthy' : 'unhealthy',
      });
    }
  }

  async getHealthcheck(): Promise<HealthcheckDto> {
    const message = this.generateHealthcheckMessage(this.serviceHealths);

    return { message, services: this.serviceHealths };
  }

  private generateHealthcheckMessage(services: ServiceHealthDto[]): string {
    const unhealthyServices = services.filter(
      (service) => service.status === 'unhealthy',
    );

    if (unhealthyServices.length > 0) {
      return `The following services are unhealthy: ${unhealthyServices
        .map((service) => service.name)
        .join(', ')} - ${this.configService.get('environment')?.toUpperCase()}`;
    }

    return `All services are healthy - ${this.configService.get('environment')?.toUpperCase()}`;
  }
}
