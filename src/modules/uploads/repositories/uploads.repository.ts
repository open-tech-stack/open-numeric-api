import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class UploadsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    where: Prisma.UploadWhereInput;
    skip: number;
    take: number;
  }) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.upload.findMany({
        where: params.where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.upload.count({ where: params.where }),
    ]);
    return { items, total };
  }

  findById(id: string) {
    return this.prisma.upload.findUnique({ where: { id } });
  }

  findByFilename(filename: string) {
    return this.prisma.upload.findUnique({ where: { filename } });
  }

  create(data: Prisma.UploadCreateInput) {
    return this.prisma.upload.create({ data });
  }

  delete(id: string) {
    return this.prisma.upload.delete({ where: { id } });
  }
}