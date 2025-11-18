import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { HealthcheckDto } from './dtos';
import { HealthcheckService } from './healthcheck.service';

@Controller('healthcheck')
@ApiTags('Healthcheck')
@ApiBearerAuth('bearer')
export class HealthcheckController {
  constructor(private readonly healthcheckService: HealthcheckService) {}

  @Get()
  @ApiOkResponse({
    description: 'The API Gateway application is healthy',
    type: HealthcheckDto,
  })
  async getHealthcheck(): Promise<HealthcheckDto> {
    return await this.healthcheckService.getHealthcheck();
  }
}
