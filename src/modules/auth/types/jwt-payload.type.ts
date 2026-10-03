import type { AdminRole } from '../../../generated/prisma/client.js';

export interface JwtPayload {
  sub: string;
  role: AdminRole;
  type: 'access' | 'refresh';
}