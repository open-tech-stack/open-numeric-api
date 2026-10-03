// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { JwtPayload } from '../../modules/auth/types/jwt-payload.type.js';

/**
 * Injecte l'utilisateur authentifié (issu du JWT) dans un paramètre de handler.
 *
 * Exemple :
 *   @Get('me')
 *   me(@CurrentUser() user: JwtPayload) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as JwtPayload;
  },
);