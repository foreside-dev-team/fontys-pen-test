import { ValidatorOptions } from "class-validator";

// Define ClassType if not available directly
export type ClassType<T = unknown> = new (...args: unknown[]) => T;

export interface ValidateOptions<T> {
  classType: ClassType<T>;
  options?: ValidatorOptions;
  description?: string;
}

export class ValidationOptions<TRequest, TResponse> {
  request!: ValidateOptions<TRequest>;
  response!: ValidateOptions<TResponse>;
}
