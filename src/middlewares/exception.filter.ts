import { ArgumentsHost, Catch, ExceptionFilter, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorHandlerService } from '../services/error.handler.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(ErrorHandlerService)
    private errorHandlerService: ErrorHandlerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const error = this.errorHandlerService.handleError(exception);

    const responseBody = {
      statusCode: error.statusCode,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp,
      path: error.path || request.url,
    };

    response.status(error.statusCode).json(responseBody);
  }
}
