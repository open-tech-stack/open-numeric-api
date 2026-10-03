import { Injectable, Logger } from '@nestjs/common';

import { SettingsRepository } from './repositories/settings.repository.js';
import type { UpdateSettingsWithTranslationsDto } from './dto/update-settings-with-translations.dto.js';
import type { SettingsResponse } from './types/settings-response.type.js';
import type { Locale } from '../../common/types/locale.type.js';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly repo: SettingsRepository) {}

  /**
   * Retourne la config publique (toutes les traductions incluses).
   */
  async getPublic(): Promise<SettingsResponse> {
    const settings = await this.repo.getOrCreate();
    return this.toResponse(settings);
  }

  /**
   * Met à jour la config + les traductions fournies.
   */
  async update(
    dto: UpdateSettingsWithTranslationsDto,
    adminId: string,
  ): Promise<SettingsResponse> {
    // 1. Champs scalaires
    const { translations, ...scalars } = dto;

    await this.repo.update(scalars, adminId);

    // 2. Traductions (une par une, upsert)
    if (translations && translations.length > 0) {
      for (const t of translations) {
        await this.repo.upsertTranslation(t.locale, {
          tagline: t.tagline,
          about: t.about,
        });
      }
    }

    this.logger.log(`Settings mis à jour par admin ${adminId}`);

    // 3. Retour à jour
    return this.getPublic();
  }

  // ----------------------------------------------------------------
  // Mapper Prisma → Response
  // ----------------------------------------------------------------
  private toResponse(settings: {
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
    updatedAt: Date;
    translations: {
      locale: string;
      tagline: string | null;
      about: string | null;
    }[];
  }): SettingsResponse {
    return {
      id: settings.id,
      siteName: settings.siteName,
      logo: settings.logo,
      favicon: settings.favicon,
      email: settings.email,
      emailSecondary: settings.emailSecondary,
      phone: settings.phone,
      phoneSecondary: settings.phoneSecondary,
      whatsapp: settings.whatsapp,
      whatsappSecondary: settings.whatsappSecondary,
      address: settings.address,
      mapEmbedUrl: settings.mapEmbedUrl,
      availability: settings.availability,
      defaultMetaTitle: settings.defaultMetaTitle,
      defaultMetaDescription: settings.defaultMetaDescription,
      googleAnalyticsId: settings.googleAnalyticsId,
      translations: settings.translations.map((t) => ({
        locale: t.locale as Locale,
        tagline: t.tagline,
        about: t.about,
      })),
      updatedAt: settings.updatedAt.toISOString(),
    };
  }
}