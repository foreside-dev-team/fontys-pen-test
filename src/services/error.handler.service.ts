import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GenericError } from '../middlewares/dtos/generic.error.dto';
import { ErrorDetail } from '../middlewares/dtos/error.dto';
import { isGenericError } from '../utils';
import { getReasonPhrase } from 'http-status-codes';

@Injectable()
export class ErrorHandlerService {
  handleError(error: unknown): GenericError {
    if (isGenericError(error as object)) {
      return error as GenericError;
    }

    if (error instanceof HttpException) {
      return this.handleHttpException(error);
    }

    if (error instanceof Error) {
      return this.handleUnexpectedError(error);
    }

    // Handle case where error is not an Error instance
    return new GenericError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'An unexpected error occurred',
    );
  }

  private handleHttpException(exception: HttpException): GenericError {
    const status = exception.getStatus();
    const response = exception.getResponse();

    let message: string;
    let details: ErrorDetail[] | undefined;

    if (typeof response === 'object' && 'message' in response) {
      message = response['error'] || getReasonPhrase(status);
      details = this.extractErrorDetails(response);
    } else {
      message = response as string;
    }

    return new GenericError(status, message, details);
  }

  private handleUnexpectedError(error: Error): GenericError {
    console.error('Unexpected error:', error);
    const details: ErrorDetail[] = [
      {
        message: error.message,
        type: 'InternalServerError',
        name: error.name,
      },
    ];
    return new GenericError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'An unexpected error occurred',
      details,
    );
  }

  private extractErrorDetails(response: any): ErrorDetail[] | undefined {
    if (Array.isArray(response['message'])) {
      return response['message'].map((item: any) => ({
        name: response['error'],
        message: item,
        type: 'api_error',
      }));
    }
    return undefined;
  }
}
