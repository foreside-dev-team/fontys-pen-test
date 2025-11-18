import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

class FetchRequestDto {
  @IsString()
  @IsNotEmpty()
  url: string;
}

@ApiTags('Debug')
@ApiBearerAuth('bearer')
@Controller('debug')
@UseGuards(JwtAuthGuard)
export class DebugController {
  constructor(private readonly httpService: HttpService) {}

  @Post('fetch')
  @ApiOperation({
    summary:
      'Performs a simple HTTP GET to the provided URL and returns status, headers, and body',
  })
  async fetch(@Body() body: FetchRequestDto): Promise<{
    status: number;
    headers: Record<string, unknown>;
    data: unknown;
  }> {
    const response = await this.httpService.axiosRef.get(body.url, {
      validateStatus: () => true,
    });

    return {
      status: response.status,
      headers: response.headers,
      data: response.data,
    };
  }
}
