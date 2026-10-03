import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class ServicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly fullInclude = {
    translations: true,
    categories: {
      orderBy: { order: 'asc' as const },
      include: {
        translations: true,
        items: {
          orderBy: { order: 'asc' as const },
          include: { translations: true },
        },
      },
    },
  };

  findAll() {
    return this.prisma.service.findMany({
      include: this.fullInclude,
      orderBy: { order: 'asc' },
    });
  }

  findActive() {
    return this.prisma.service.findMany({
      where: { isActive: true },
      include: this.fullInclude,
      orderBy: { order: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.service.findUnique({
      where: { id },
      include: this.fullInclude,
    });
  }

  findBySlug(slug: string) {
    return this.prisma.service.findUnique({
      where: { slug },
      include: this.fullInclude,
    });
  }

  findByKey(key: string) {
    return this.prisma.service.findUnique({
      where: { key },
      include: this.fullInclude,
    });
  }

  create(data: Prisma.ServiceCreateInput) {
    return this.prisma.service.create({
      data,
      include: this.fullInclude,
    });
  }

  update(id: string, data: Prisma.ServiceUpdateInput) {
    return this.prisma.service.update({
      where: { id },
      data,
      include: this.fullInclude,
    });
  }

  delete(id: string) {
    return this.prisma.service.delete({ where: { id } });
  }

  // ----------------------------------------------------------------
  // Translations
  // ----------------------------------------------------------------
  async replaceTranslations(
    serviceId: string,
    translations: {
      locale: string;
      name: string;
      heroTitle?: string;
      heroTitleHighlight?: string;
      heroSubtitle?: string;
    }[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.serviceTranslation.deleteMany({ where: { serviceId } });
      await tx.serviceTranslation.createMany({
        data: translations.map((t) => ({
          serviceId,
          locale: t.locale,
          name: t.name,
          heroTitle: t.heroTitle ?? null,
          heroTitleHighlight: t.heroTitleHighlight ?? null,
          heroSubtitle: t.heroSubtitle ?? null,
        })),
      });
    });
  }

  // ----------------------------------------------------------------
  // Categories
  // ----------------------------------------------------------------
  createCategory(data: Prisma.ServiceCategoryCreateInput) {
    return this.prisma.serviceCategory.create({
      data,
      include: { translations: true, items: { include: { translations: true } } },
    });
  }

  findCategoryById(id: string) {
    return this.prisma.serviceCategory.findUnique({
      where: { id },
      include: { translations: true, items: { include: { translations: true } } },
    });
  }

  updateCategory(id: string, data: Prisma.ServiceCategoryUpdateInput) {
    return this.prisma.serviceCategory.update({
      where: { id },
      data,
      include: { translations: true, items: { include: { translations: true } } },
    });
  }

  deleteCategory(id: string) {
    return this.prisma.serviceCategory.delete({ where: { id } });
  }

  async replaceCategoryTranslations(
    categoryId: string,
    translations: { locale: string; name: string; description?: string }[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.serviceCategoryTranslation.deleteMany({
        where: { serviceCategoryId: categoryId },
      });
      await tx.serviceCategoryTranslation.createMany({
        data: translations.map((t) => ({
          serviceCategoryId: categoryId,
          locale: t.locale,
          name: t.name,
          description: t.description ?? null,
        })),
      });
    });
  }

  // ----------------------------------------------------------------
  // Items
  // ----------------------------------------------------------------
  createItem(data: Prisma.ServiceItemCreateInput) {
    return this.prisma.serviceItem.create({
      data,
      include: { translations: true },
    });
  }

  findItemById(id: string) {
    return this.prisma.serviceItem.findUnique({
      where: { id },
      include: { translations: true },
    });
  }

  updateItem(id: string, data: Prisma.ServiceItemUpdateInput) {
    return this.prisma.serviceItem.update({
      where: { id },
      data,
      include: { translations: true },
    });
  }

  deleteItem(id: string) {
    return this.prisma.serviceItem.delete({ where: { id } });
  }

  async replaceItemTranslations(
    itemId: string,
    translations: { locale: string; name: string; description?: string }[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.serviceItemTranslation.deleteMany({
        where: { serviceItemId: itemId },
      });
      await tx.serviceItemTranslation.createMany({
        data: translations.map((t) => ({
          serviceItemId: itemId,
          locale: t.locale,
          name: t.name,
          description: t.description ?? null,
        })),
      });
    });
  }
}