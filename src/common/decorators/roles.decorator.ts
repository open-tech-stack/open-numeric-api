import { SetMetadata } from '@nestjs/common';

import type { AdminRole } from '../../generated/prisma/client.js';

/**
 * Restreint une route à certains rôles.
 * Exemple : @Roles(AdminRole.ADMIN)
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);