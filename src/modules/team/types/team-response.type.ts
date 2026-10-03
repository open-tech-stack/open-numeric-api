import type { Locale } from '../../../common/types/locale.type.js';

export interface TeamMemberTranslation {
  locale: Locale;
  name: string;
  role: string;
  bio: string;
}

export interface TeamMemberResponse {
  id: string;
  key: string;
  image: string;
  linkedin: string | null;
  twitter: string | null;
  order: number;
  isActive: boolean;
  translations: TeamMemberTranslation[];
}