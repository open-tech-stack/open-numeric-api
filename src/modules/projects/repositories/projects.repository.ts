import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly fullInclude = {
    client: true,
    translations: true,
    gallery: {
      orderBy: { order: 'asc' as const },
      include: { translations: true },
    },
    features: {
      orderBy: { order: 'asc' as const },
      include: { translations: true },
    },
    links: {
      orderBy: { order: 'asc' as const },
    },
  };

async findAll(params: {
  where: Prisma.ProjectWhereInput;
  skip: number;
  take: number;
  orderBy: Prisma.ProjectOrderByWithRelationInput[];
}) {
  const [items, total] = await Promise.all([
    this.prisma.project.findMany({
      where: params.where,
      include: this.fullInclude,
      skip: params.skip,
      take: params.take,
      orderBy: params.orderBy,
    }),
    this.prisma.project.count({ where: params.where }),
  ]);

  return { items, total };
}

  findById(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: this.fullInclude,
    });
  }

  findBySlug(slug: string) {
    return this.prisma.project.findUnique({
      where: { slug },
      include: this.fullInclude,
    });
  }

  /** Trouve des projets similaires (même catégorie, sauf le courant) */
  findSimilar(slug: string, category: string, limit = 3) {
    return this.prisma.project.findMany({
      where: {
        slug: { not: slug },
        category: category as any,
        isActive: true,
      },
      include: this.fullInclude,
      orderBy: [{ featured: 'desc' }, { year: 'desc' }],
      take: limit,
    });
  }

  create(data: Prisma.ProjectCreateInput) {
    return this.prisma.project.create({
      data,
      include: this.fullInclude,
    });
  }

  update(id: string, data: Prisma.ProjectUpdateInput) {
    return this.prisma.project.update({
      where: { id },
      data,
      include: this.fullInclude,
    });
  }

  delete(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }

  // ----------------------------------------------------------------
  // Replace helpers (translations / gallery / features / links)
  // ----------------------------------------------------------------
  async replaceTranslations(
    projectId: string,
    translations: {
      locale: string;
      title: string;
      description: string;
      longDescription?: string;
    }[],
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.projectTranslation.deleteMany({ where: { projectId } });
      await tx.projectTranslation.createMany({
        data: translations.map((t) => ({
          projectId,
          locale: t.locale,
          title: t.title,
          description: t.description,
          longDescription: t.longDescription ?? null,
        })),
      });
    });
  }

  async replaceGallery(
    projectId: string,
    gallery: {
      src: string;
      order?: number;
      translations: { locale: string; caption: string }[];
    }[],
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.projectGallery.deleteMany({ where: { projectId } });
      for (const g of gallery) {
        await tx.projectGallery.create({
          data: {
            projectId,
            src: g.src,
            order: g.order ?? 0,
            translations: {
              create: g.translations.map((t) => ({
                locale: t.locale,
                caption: t.caption,
              })),
            },
          },
        });
      }
    });
  }

  async replaceFeatures(
    projectId: string,
    features: {
      key: string;
      icon: string;
      order?: number;
      translations: { locale: string; title: string; description: string }[];
    }[],
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.projectFeature.deleteMany({ where: { projectId } });
      for (const f of features) {
        await tx.projectFeature.create({
          data: {
            projectId,
            key: f.key,
            icon: f.icon,
            order: f.order ?? 0,
            translations: {
              create: f.translations.map((t) => ({
                locale: t.locale,
                title: t.title,
                description: t.description,
              })),
            },
          },
        });
      }
    });
  }

  async replaceLinks(
    projectId: string,
    links: { type: string; url: string; order?: number }[],
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.projectLink.deleteMany({ where: { projectId } });
      if (links.length > 0) {
        await tx.projectLink.createMany({
          data: links.map((l) => ({
            projectId,
            type: l.type as any,
            url: l.url,
            order: l.order ?? 0,
          })),
        });
      }
    });
  }
}