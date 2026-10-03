import type { Locale } from '../../../common/types/locale.type.js';

export interface TestimonialTranslation {
  locale: Locale;
  quote: string;
  author: string;
  company: string;
}

export interface TestimonialResponse {
  id: string;
  key: string;
  image: string;
  rating: number;
  order: number;
  isActive: boolean;
  translations: TestimonialTranslation[];
}