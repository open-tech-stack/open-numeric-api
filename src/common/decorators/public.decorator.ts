// src/common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

/**
 * Marque une route comme PUBLIQUE.
 * Le JwtAuthGuard global ignorera ces routes.
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);