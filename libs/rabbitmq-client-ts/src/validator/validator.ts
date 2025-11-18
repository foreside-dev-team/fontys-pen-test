import { ValidationError, ValidatorOptions, validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { StatusCodes } from 'http-status-codes';
import { IErrorDetail, ValidateOptions } from '../types';
import { genericErrorHandler, isGenericError } from '../utils';

const defaultValidatorOptions: ValidatorOptions = {
  whitelist: true,
  forbidNonWhitelisted: false, // true,
  // TODO: Investigate why this is causing a problem while it is enabled/true
};

/**
 * Validates and transforms the given data using the provided options.
 *
 * @template T - The type of the data to be validated and transformed.
 * @param options - The options for validation and transformation.
 * @param data - The data to be validated and transformed.
 * @param errorMessage - The error message to be thrown if validation fails.
 * @returns A promise that resolves to the validated and transformed data.
 * @throws HttpError if the data is invalid or validation fails.
 */
export async function validateAndTransform<T>(
  options: ValidateOptions<T>,
  data: T,
  errorMessage: string,
): Promise<T> {
  if (!options.classType) {
    throw genericErrorHandler({
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Invalid classType provided for transformation.',
    });
  }

  if (isGenericError(data as object)) {
    throw data;
  }
  const value = plainToInstance(options.classType, data);

  if (!value) {
    throw genericErrorHandler({
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Invalid data provided for transformation.',
    });
  }

  const errors = await validate(
    value as object,
    options.options ?? defaultValidatorOptions,
  );
  if (errors.length > 0) {
    throw genericErrorHandler({
      statusCode: StatusCodes.BAD_REQUEST,
      message: errorMessage,
      details: extractErrorMessages(errors),
    });
  }

  return value;
}

/**
 * Extracts error messages from an array of validation errors.
 *
 * @param errors - The array of validation errors.
 * @param parentProperty - Optional parent property name.
 * @returns An array of IErrorDetail containing the extracted error messages.
 */
export function extractErrorMessages(
  errors: ValidationError[],
  parentProperty?: string,
): IErrorDetail[] {
  return errors.reduce((prev, error) => {
    const property = parentProperty
      ? `${parentProperty}.${error.property}`
      : error.property;
    const constraints = error.constraints
      ? Object.entries(error.constraints).map(([key, value]) => ({
          message: value,
          type: 'validation_error',
          name: key,
        }))
      : []; // If no constraints, return an empty array
    const childErrors = error.children
      ? extractErrorMessages(error.children, property)
      : [];

    // Concatenate arrays
    return [...prev, ...constraints, ...childErrors];
  }, [] as IErrorDetail[]);
}
