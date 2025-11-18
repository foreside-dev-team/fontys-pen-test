import { GenericError } from '../types';
import { plainToInstance } from 'class-transformer';

export const isGenericError = (obj: object): obj is GenericError => {
  const genericError = plainToInstance(GenericError, obj);
  const isGenericError =
    typeof genericError.statusCode === 'number' &&
    typeof genericError.message === 'string' &&
    (Array.isArray(genericError.details) || !genericError.details) &&
    typeof genericError.timestamp === 'string';
  return isGenericError;
};
