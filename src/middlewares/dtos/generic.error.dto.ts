import {
  IsNumber,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsDateString,
} from 'class-validator';
import { getReasonPhrase } from 'http-status-codes';
import { ErrorDetail } from './error.dto';

export class GenericError extends Error {
  @IsNumber()
  @IsNotEmpty()
  public statusCode: number;

  @IsNotEmpty()
  @IsString()
  public readonly message: string;

  @IsOptional()
  @IsArray()
  public readonly details?: ErrorDetail[];

  @IsNotEmpty()
  @IsString()
  @IsDateString()
  public readonly timestamp: string;

  @IsOptional()
  @IsString()
  public readonly path?: string;

  constructor(
    statusCode: number,
    message?: string,
    details?: ErrorDetail[],
    path?: string,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message
      ? message
      : statusCode
        ? getReasonPhrase(this.statusCode)
        : '';
    this.details = details;
    this.timestamp = new Date().toUTCString();
    this.path = path;
  }
}
