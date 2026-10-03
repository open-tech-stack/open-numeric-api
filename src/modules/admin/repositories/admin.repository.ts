import { Injectable } from '@nestjs/common';
import type { Admin, AdminRole, Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUsername(username: string): Promise<Admin | null> {
    return this.prisma.admin.findUnique({ where: { username } });
  }

  findById(id: string): Promise<Admin | null> {
    return this.prisma.admin.findUnique({ where: { id } });
  }

  findAll(): Promise<Admin[]> {
    return this.prisma.admin.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: Prisma.AdminCreateInput): Promise<Admin> {
    return this.prisma.admin.create({ data });
  }

  update(id: string, data: Prisma.AdminUpdateInput): Promise<Admin> {
    return this.prisma.admin.update({ where: { id }, data });
  }

  delete(id: string): Promise<Admin> {
    return this.prisma.admin.delete({ where: { id } });
  }

  updateRefreshHash(id: string, hash: string | null): Promise<Admin> {
    return this.prisma.admin.update({
      where: { id },
      data: { refreshTokenHash: hash },
    });
  }

  updateLastLogin(id: string): Promise<Admin> {
    return this.prisma.admin.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  count(): Promise<number> {
    return this.prisma.admin.count();
  }
}