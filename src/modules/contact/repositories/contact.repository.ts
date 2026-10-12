import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class ContactRepository {
  constructor(private readonly prisma: PrismaService) {}

async findAll(params: {
  where: Prisma.ContactSubmissionWhereInput;
  skip: number;
  take: number;
}) {
  const [items, total] = await Promise.all([
    this.prisma.contactSubmission.findMany({
      where: params.where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.contactSubmission.count({ where: params.where }),
  ]);
  return { items, total };
}
  findById(id: string) {
    return this.prisma.contactSubmission.findUnique({ where: { id } });
  }

  create(data: Prisma.ContactSubmissionCreateInput) {
    return this.prisma.contactSubmission.create({ data });
  }

  update(id: string, data: Prisma.ContactSubmissionUpdateInput) {
    return this.prisma.contactSubmission.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.contactSubmission.delete({ where: { id } });
  }
}