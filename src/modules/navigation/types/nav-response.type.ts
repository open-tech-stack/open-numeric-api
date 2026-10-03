import type { Locale } from '../../../common/types/locale.type.js';

export interface NavTranslation {
  locale: Locale;
  label: string;
}

/**
 * Représentation publique d'un NavItem.
 * Récursive : `children` contient les sous-items.
 */
export interface NavResponse {
  id: string;
  key: string;
  href: string;
  order: number;
  isActive: boolean;
  parentId: string | null;
  translations: NavTranslation[];
  children: NavResponse[];
}