import { SetMetadata } from '@nestjs/common';
import { ISupportedScopes } from '../config/configuration';

export const SCOPES_KEY = 'scopes';
export const Scopes = (...scopes: ISupportedScopes[]) =>
  SetMetadata(SCOPES_KEY, scopes);
