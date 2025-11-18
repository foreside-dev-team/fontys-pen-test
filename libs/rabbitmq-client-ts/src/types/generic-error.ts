import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { getReasonPhrase } from "http-status-codes";

export interface IErrorDetail {
  message: string;
  type: string;
  name: string;
}

export class GenericError extends Error {
  @IsNumber()
  @IsNotEmpty()
  public statusCode: number;

  @IsNotEmpty()
  @IsString()
  public readonly message: string;

  @IsOptional()
  @IsArray()
  public readonly details?: IErrorDetail[];

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
    details?: IErrorDetail[],
    path?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message
      ? message
      : statusCode
      ? getReasonPhrase(this.statusCode)
      : "";
    this.details = details;
    this.timestamp = new Date().toUTCString();
    this.path = path;
  }

  public toJSON() {
    return {
      statusCode: this.statusCode,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      path: this.path,
    };
  }
}
