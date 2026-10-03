import type { Locale } from '../../../common/types/locale.type.js';
import type {
  ProjectCategory,
  ProjectLinkType,
  ProjectScope,
  ProjectStatus,
} from '../../../generated/prisma/client.js';

export interface ProjectTranslation {
  locale: Locale;
  title: string;
  description: string;
  longDescription: string | null;
}

export interface ProjectGalleryItem {
  id: string;
  src: string;
  order: number;
  translations: { locale: Locale; caption: string }[];
}

export interface ProjectFeatureItem {
  id: string;
  key: string;
  icon: string;
  order: number;
  translations: { locale: Locale; title: string; description: string }[];
}

export interface ProjectLinkItem {
  id: string;
  type: ProjectLinkType;
  url: string;
  order: number;
}

export interface ProjectClient {
  id: string;
  name: string;
  logo: string;
  url: string | null;
}

export interface ProjectResponse {
  id: string;
  slug: string;
  cover: string;
  heroImage: string | null;
  category: ProjectCategory;
  scope: ProjectScope;
  status: ProjectStatus;
  year: number;
  tech: string[];
  tags: string[];
  featured: boolean;
  order: number;
  isActive: boolean;
  client: ProjectClient | null;
  translations: ProjectTranslation[];
  gallery: ProjectGalleryItem[];
  features: ProjectFeatureItem[];
  links: ProjectLinkItem[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Réponse paginée standard.
 */
export interface PaginatedProjects {
  items: ProjectResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}