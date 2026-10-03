import type { Locale } from '../../../common/types/locale.type.js';

export interface ServiceTranslation {
  locale: Locale;
  name: string;
  heroTitle: string | null;
  heroTitleHighlight: string | null;
  heroSubtitle: string | null;
}

export interface ServiceCategoryTranslation {
  locale: Locale;
  name: string;
  description: string | null;
}

export interface ServiceItemTranslation {
  locale: Locale;
  name: string;
  description: string | null;
}

export interface ServiceItemResponse {
  id: string;
  key: string;
  image: string | null;
  icon: string | null;
  order: number;
  translations: ServiceItemTranslation[];
}

export interface ServiceCategoryResponse {
  id: string;
  key: string;
  icon: string;
  accent: string;
  order: number;
  translations: ServiceCategoryTranslation[];
  items: ServiceItemResponse[];
}

export interface ServiceResponse {
  id: string;
  key: string;
  slug: string;
  href: string;
  icon: string;
  accent: string;
  order: number;
  isActive: boolean;
  translations: ServiceTranslation[];
  categories: ServiceCategoryResponse[];
}