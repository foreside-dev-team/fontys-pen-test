import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class OrderDto {
  @ApiProperty({
    description: 'External identifier of the order in Operation/CRM',
    required: false,
    example: '1',
  })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({
    description: 'Order number as shown to the customer',
    required: true,
    example: 'OC-80061',
  })
  @IsString()
  @IsNotEmpty()
  orderNumber: string;

  @ApiProperty({
    description: 'Total amount of the order as reported by Operation/CRM',
    required: true,
    example: 1234.56,
  })
  @IsNumber()
  @IsNotEmpty()
  totalAmount: number;
}
