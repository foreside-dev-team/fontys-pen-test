import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { GenericError } from 'rabbitmq-client-ts';

export class ErrorDetail {
  @ApiProperty({
    description: 'Detail name',
    example: 'Optional name',
  })
  public name: string;

  @ApiProperty({
    description: 'Detail message',
    example: 'Optional message',
  })
  @IsNotEmpty()
  public message: string;

  @ApiProperty({
    description: 'Detail type',
    example: 'Optional type',
  })
  public type: string;
}

export class GenericErrorDto extends GenericError {
  @ApiProperty({
    description: 'HTTP status code',
    required: true,
  })
  public statusCode: number;

  @ApiProperty({
    description: 'Error message',
    required: true,
  })
  public readonly message: string;

  @ApiProperty({
    description: 'Error details',
    required: false,
    type: ErrorDetail,
    isArray: true,
  })
  @Type(() => ErrorDetail)
  details: ErrorDetail[];

  @ApiProperty({
    description: 'Timestamp of the error',
    required: true,
    type: 'string',
    format: 'date-time',
  })
  public readonly timestamp: string;

  @ApiProperty({
    description: 'Path of the request',
    required: false,
    example: '/example/path',
  })
  public readonly path?: string;
}

export class Error400Dto extends GenericErrorDto {
  @ApiProperty({
    description: 'HTTP status code',
    required: true,
    example: 400,
  })
  public statusCode: number;
  @ApiProperty({
    description: 'Error message',
    required: true,
    example: 'Bad Request',
  })
  public readonly message: string;
}

export class Error401Dto extends GenericErrorDto {
  @ApiProperty({
    description: 'HTTP status code',
    required: true,
    example: 401,
  })
  public statusCode: number;
  @ApiProperty({
    description: 'Error message',
    required: true,
    example: 'Unauthorized',
  })
  public readonly message: string;
}

export class Error403Dto extends GenericErrorDto {
  @ApiProperty({
    description: 'HTTP status code',
    required: true,
    example: 403,
  })
  public statusCode: number;
  @ApiProperty({
    description: 'Error message',
    required: true,
    example: 'Forbidden',
  })
  public readonly message: string;
}

export class Error500Dto extends GenericErrorDto {
  @ApiProperty({
    description: 'HTTP status code',
    required: true,
    example: 500,
  })
  public statusCode: number;
  @ApiProperty({
    description: 'Error message',
    required: true,
    example: 'Internal Server Error',
  })
  public readonly message: string;
}
