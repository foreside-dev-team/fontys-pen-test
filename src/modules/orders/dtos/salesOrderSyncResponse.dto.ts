import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SalesOrderSyncResponseDto {
  @ApiProperty({
    example: 'Sales order synced successfully',
  })
  @IsString()
  readonly message: string;
}
