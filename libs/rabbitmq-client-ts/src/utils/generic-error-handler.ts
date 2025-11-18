import { getReasonPhrase } from 'http-status-codes';
import { GenericError, IErrorDetail } from '../types';

interface GenericErrorHandlerParams {
  statusCode: number;
  message?: string;
  details?: IErrorDetail[];
  path?: string;
  defaultDetails?: boolean;
  queueError?: boolean;
}

export const genericErrorHandler = ({
  statusCode,
  message,
  details,
  path,
  defaultDetails = false,
  queueError = false,
}: GenericErrorHandlerParams): GenericError => {
  const createErrorDetails = (msg: string, name: string): IErrorDetail[] => [
    {
      message: msg,
      type: queueError ? 'QueueError' : 'Error',
      name,
    },
  ];

  const defaultMessages: Record<number, string> = {
    400: 'The request is invalid',
    401: 'You need to be authenticated to access this resource',
    403: 'You do not have permissions to access this resource',
    404: 'The requested resource is not found',
    405: 'The requested method is not allowed',
    406: 'The requested resource is not acceptable',
    408: 'The request timed out',
    500: queueError
      ? 'An error occured in the queue'
      : 'An error occurred on the server',
    502: 'The server received an invalid response from the upstream server',
    503: 'The server is currently unavailable',
  };

  const defaultMessage =
    defaultMessages[statusCode] ||
    'We have no idea yet how this happened but we are looking into it!';
  const resolvedMessage = message ?? defaultMessage;
  const defaultErrorDetails =
    details ??
    (defaultDetails && defaultMessages[statusCode]
      ? createErrorDetails(resolvedMessage, getReasonPhrase(statusCode))
      : undefined);

  return new GenericError(
    statusCode,
    resolvedMessage,
    defaultErrorDetails,
    path,
  );
};
