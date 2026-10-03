import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class TeamRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly fullInclude = {
    translations: true,
  };

  findAll() {
    return this.prisma.teamMember.findMany({
      include: this.fullInclude,
      orderBy: { order: 'asc' },
    });
  }

  findActive() {
    return this.prisma.teamMember.findMany({
      where: { isActive: true },
      include: this.fullInclude,
      orderBy: { order: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.teamMember.findUnique({
      where: { id },
      include: this.fullInclude,
    });
  }

  findByKey(key: string) {
    return this.prisma.teamMember.findUnique({
      where: { key },
      include: this.fullInclude,
    });
  }

  create(data: Prisma.TeamMemberCreateInput) {
    return this.prisma.teamMember.create({
      data,
      include: this.fullInclude,
    });
  }

  update(id: string, data: Prisma.TeamMemberUpdateInput) {
    return this.prisma.teamMember.update({
      where: { id },
      data,
      include: this.fullInclude,
    });
  }

  delete(id: string) {
    return this.prisma.teamMember.delete({ where: { id } });
  }

  async replaceTranslations(
    teamMemberId: string,
    translations: { locale: string; name: string; role: string; bio: string }[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.teamMemberTranslation.deleteMany({ where: { teamMemberId } });
      await tx.teamMemberTranslation.createMany({
        data: translations.map((t) => ({
          teamMemberId,
          locale: t.locale,
          name: t.name,
          role: t.role,
          bio: t.bio,
        })),
      });
    });
  }
}