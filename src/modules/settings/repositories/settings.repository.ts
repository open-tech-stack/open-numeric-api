import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

const SINGLETON_ID = 'singleton';

@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère le singleton SiteSettings.
   * Le crée avec des valeurs par défaut si absent.
   */
  async getOrCreate() {
    const existing = await this.prisma.siteSettings.findUnique({
      where: { id: SINGLETON_ID },
      include: { translations: true },
    });

    if (existing) return existing;

    // Valeurs par défaut à la création
    return this.prisma.siteSettings.create({
      data: {
        id: SINGLETON_ID,
        siteName: 'Open Numeric',
        logo: '/uploads/logo.png',
        email: 'contact@open-numeric.com',
        phone: '+226 65 03 37 42',
        address: 'SOMGANDE, Ouagadougou, Burkina Faso',
        availability: '24/7',
      },
      include: { translations: true },
    });
  }

  async update(
    data: Prisma.SiteSettingsUpdateInput,
    updatedById?: string,
  ) {
    return this.prisma.siteSettings.update({
      where: { id: SINGLETON_ID },
      data: {
        ...data,
        ...(updatedById && { updatedBy: { connect: { id: updatedById } } }),
      },
      include: { translations: true },
    });
  }

  /**
   * Upsert une traduction (création ou mise à jour).
   */
  async upsertTranslation(
    locale: string,
    data: { tagline?: string | null; about?: string | null },
  ) {
    return this.prisma.siteSettingsTranslation.upsert({
      where: {
        siteSettingsId_locale: {
          siteSettingsId: SINGLETON_ID,
          locale,
        },
      },
      create: {
        siteSettingsId: SINGLETON_ID,
        locale,
        tagline: data.tagline ?? null,
        about: data.about ?? null,
      },
      update: {
        tagline: data.tagline ?? undefined,
        about: data.about ?? undefined,
      },
    });
  }
}