import type { Locale } from '../../../common/types/locale.type.js';

export interface SocialTranslation {
  locale: Locale;
  name: string;
}

export interface SocialResponse {
  id: string;
  key: string;
  icon: string;
  url: string;
  hoverColor: string;
  order: number;
  isActive: boolean;
  translations: SocialTranslation[];
}