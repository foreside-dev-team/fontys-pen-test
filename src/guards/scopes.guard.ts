import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ISupportedScopes } from '../config/configuration';
import { SCOPES_KEY } from '../decorators/scopes.decorator';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<
      ISupportedScopes[] | undefined
    >(SCOPES_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredScopes) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;

    let roles: string[] = Array.isArray(user?.roles) ? [...user.roles] : [];

    // Check for additional metadata in request headers
    const rawHeader = request.headers['x-apigw-meta'] as
      | string
      | string[]
      | undefined;

    const headerValue =
      Array.isArray(rawHeader) && rawHeader.length > 0
        ? rawHeader[0]
        : rawHeader;

    if (typeof headerValue === 'string' && headerValue.trim().length > 0) {
      const extraScopes = headerValue
        .split(',')
        .map((scope) => scope.trim())
        .filter((scope) => scope.length > 0);

      if (extraScopes.length > 0) {
        roles = Array.from(new Set([...roles, ...extraScopes]));
      }
    }

    if (roles.length === 0) {
      return false;
    }

    return requiredScopes.every((scope) => roles.includes(scope));
  }
}
