import { GenericError } from '../types';
import { BASE_64_REGEX } from './constants';
import { isGenericError } from './is-generic-error';

/**
 * Generates a buffer from the provided payload.
 * @param payload The payload to be converted to a buffer.
 * @returns A buffer containing the serialized payload.
 */
export const generateBuffer = <TData>(payload: TData) => {
  try {
    return Buffer.from(
      JSON.stringify(
        isGenericError(payload as object)
          ? (payload as GenericError).toJSON()
          : payload,
      ),
    );
  } catch (error) {
    throw new GenericError(500, 'Error generating buffer');
  }
};

/**
 * Parses a Buffer into a DXCRabbitMQHandlerProps object.
 *
 * @param payload - The Buffer to be parsed.
 * @returns The parsed DXCRabbitMQHandlerProps object.
 * @throws If the payload cannot be parsed as JSON.
 */
export const parseBufferOrString = <TData>(
  payload: Buffer,
): TData | GenericError => {
  let content: string;
  let data: unknown;
  let payloadString: string;

  // Check to see if we have a Buffer or a String
  if (Buffer.isBuffer(payload)) {
    // Convert the buffer to a string
    payloadString = payload.toString();
  } else {
    payloadString = payload;
  }

  // Check if its a Base64 encoded string or not...
  if (BASE_64_REGEX.test(payloadString)) {
    try {
      content = Buffer.from(payloadString, 'base64').toString('ascii');
    } catch (error) {
      throw new GenericError(
        500,
        'Error decoding base64 buffer',
        [],
        'parseBufferOrString',
      );
    }
  } else {
    content = payloadString;
  }

  // Try to parse the content as JSON
  try {
    data = JSON.parse(content) as TData;
  } catch (error) {
    throw new GenericError(
      500,
      'Error parsing buffer',
      [],
      'parseBufferOrString',
    );
  }

  // Ensure that the parsed data is a GenericError if it has the right structure
  if (isGenericError(data as object)) {
    data = Object.setPrototypeOf(data, GenericError.prototype);
  }

  return data as TData | GenericError;
};
