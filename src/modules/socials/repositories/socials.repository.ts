import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class SocialsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly fullInclude = {
    translations: true,
  };

  findAll() {
    return this.prisma.social.findMany({
      include: this.fullInclude,
      orderBy: { order: 'asc' },
    });
  }

  findActive() {
    return this.prisma.social.findMany({
      where: { isActive: true },
      include: this.fullInclude,
      orderBy: { order: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.social.findUnique({
      where: { id },
      include: this.fullInclude,
    });
  }

  findByKey(key: string) {
    return this.prisma.social.findUnique({
      where: { key },
      include: this.fullInclude,
    });
  }

  create(data: Prisma.SocialCreateInput) {
    return this.prisma.social.create({
      data,
      include: this.fullInclude,
    });
  }

  update(id: string, data: Prisma.SocialUpdateInput) {
    return this.prisma.social.update({
      where: { id },
      data,
      include: this.fullInclude,
    });
  }

  delete(id: string) {
    return this.prisma.social.delete({ where: { id } });
  }

  async replaceTranslations(
    socialId: string,
    translations: { locale: string; name: string }[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.socialTranslation.deleteMany({ where: { socialId } });
      await tx.socialTranslation.createMany({
        data: translations.map((t) => ({
          socialId,
          locale: t.locale,
          name: t.name,
        })),
      });
    });
  }
}