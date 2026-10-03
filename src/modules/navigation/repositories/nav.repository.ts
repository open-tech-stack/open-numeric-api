import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class NavRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Récupère TOUS les items (avec traductions), à plat.
   * Le service reconstruit l'arbre ensuite.
   */
  findAll() {
    return this.prisma.navItem.findMany({
      include: { translations: true },
      orderBy: [{ parentId: 'asc' }, { order: 'asc' }],
    });
  }

  findById(id: string) {
    return this.prisma.navItem.findUnique({
      where: { id },
      include: { translations: true },
    });
  }

  findByKey(key: string) {
    return this.prisma.navItem.findUnique({
      where: { key },
      include: { translations: true },
    });
  }

  create(data: Prisma.NavItemCreateInput) {
    return this.prisma.navItem.create({
      data,
      include: { translations: true },
    });
  }

  update(id: string, data: Prisma.NavItemUpdateInput) {
    return this.prisma.navItem.update({
      where: { id },
      data,
      include: { translations: true },
    });
  }

  delete(id: string) {
    return this.prisma.navItem.delete({ where: { id } });
  }

  /**
   * Remplace les traductions d'un NavItem par celles fournies.
   * Transaction atomique.
   */
  async replaceTranslations(
    navItemId: string,
    translations: { locale: string; label: string }[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.navItemTranslation.deleteMany({ where: { navItemId } });
      await tx.navItemTranslation.createMany({
        data: translations.map((t) => ({
          navItemId,
          locale: t.locale,
          label: t.label,
        })),
      });
      return tx.navItem.findUnique({
        where: { id: navItemId },
        include: { translations: true },
      });
    });
  }

  /**
   * Réordonne en masse : applique order + parentId pour chaque item.
   * Transaction atomique.
   */
  async reorderMany(
    items: { id: string; order: number; parentId: string | null }[],
  ) {
    return this.prisma.$transaction(
      items.map((it) =>
        this.prisma.navItem.update({
          where: { id: it.id },
          data: { order: it.order, parentId: it.parentId },
        }),
      ),
    );
  }

  countChildren(id: string) {
    return this.prisma.navItem.count({ where: { parentId: id } });
  }
}