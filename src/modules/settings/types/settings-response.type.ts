import { Locale } from "../../../common/types/index.js";

/**
 * Traduction d'un texte de SiteSettings.
 */
export interface SettingsTranslation {
  locale: Locale;
  tagline: string | null;
  about: string | null;
}

/**
 * Représentation publique d'un SiteSettings (utilisée par le frontend).
 * Toutes les traductions sont incluses : le front choisit selon sa locale.
 */
export interface SettingsResponse {
  id: string;
  siteName: string;
  logo: string;
  favicon: string | null;

  email: string;
  emailSecondary: string | null;
  phone: string;
  phoneSecondary: string | null;
  whatsapp: string | null;
  whatsappSecondary: string | null;

  address: string;
  mapEmbedUrl: string | null;
  availability: string;

  defaultMetaTitle: string | null;
  defaultMetaDescription: string | null;
  googleAnalyticsId: string | null;

  translations: SettingsTranslation[];

  updatedAt: string;
}