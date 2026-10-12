import type { AdminRole } from '../../../generated/prisma/client.js';

/**
 * Représentation publique d'un Admin.
 * ⚠️ Ne JAMAIS inclure `passwordHash` ni `refreshTokenHash`.
 */
export interface AdminResponse {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  role: AdminRole;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Version allégée pour les selects (auteur d'un article, d'un projet, etc.) */
export interface AdminMinimal {
  id: string;
  username: string;
  displayName: string;
  role: AdminRole;
}