import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import type { AdminRole } from '../../generated/prisma/client.js';
import type { JwtPayload } from '../../modules/auth/types/jwt-payload.type.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

/**
 * Guard de rôles.
 *
 * À utiliser APRÈS le JwtAuthGuard : lit `request.user` (rempli par la
 * stratégie JWT) et vérifie que le rôle fait partie des rôles autorisés.
 *
 * Si aucun décorateur @Roles() n'est présent, la route est autorisée
 * à tout utilisateur authentifié.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié.');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Accès refusé. Rôle requis : ${requiredRoles.join(' ou ')}.`,
      );
    }

    return true;
  }
}