import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class ClientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.client.findMany({
      orderBy: { order: 'asc' },
    });
  }

  findActive() {
    return this.prisma.client.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.client.findUnique({ where: { id } });
  }

  create(data: Prisma.ClientCreateInput) {
    return this.prisma.client.create({ data });
  }

  update(id: string, data: Prisma.ClientUpdateInput) {
    return this.prisma.client.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.client.delete({ where: { id } });
  }

  countProjects(clientId: string) {
    return this.prisma.project.count({ where: { clientId } });
  }
}