import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class QuoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    where: Prisma.QuoteRequestWhereInput;
    skip: number;
    take: number;
  }) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.quoteRequest.findMany({
        where: params.where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.quoteRequest.count({ where: params.where }),
    ]);
    return { items, total };
  }

  findById(id: string) {
    return this.prisma.quoteRequest.findUnique({ where: { id } });
  }

  create(data: Prisma.QuoteRequestCreateInput) {
    return this.prisma.quoteRequest.create({ data });
  }

  update(id: string, data: Prisma.QuoteRequestUpdateInput) {
    return this.prisma.quoteRequest.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.quoteRequest.delete({ where: { id } });
  }

  countByIp(ip: string, since: Date) {
    return this.prisma.quoteRequest.count({
      where: { ip, createdAt: { gte: since } },
    });
  }
}