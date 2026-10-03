import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import type { AdminRole } from '../../generated/prisma/client.js';
import { AdminRepository } from './repositories/admin.repository.js';
import { CreateAdminDto } from './dto/create-admin.dto.js';
import { UpdateAdminDto } from './dto/update-admin.dto.js';

@Injectable()
export class AdminService {
  constructor(private readonly repo: AdminRepository) {}

  async create(dto: CreateAdminDto) {
    const existing = await this.repo.findByUsername(dto.username);
    if (existing) {
      throw new ConflictException('Ce nom d’utilisateur existe déjà.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.repo.create({
      username: dto.username,
      passwordHash,
      displayName: dto.displayName,
      email: dto.email,
      role: dto.role as AdminRole,
    });
  }

  findAll() {
    return this.repo.findAll();
  }

  async findById(id: string) {
    const admin = await this.repo.findById(id);
    if (!admin) throw new NotFoundException('Admin introuvable.');
    return admin;
  }

  async update(id: string, dto: UpdateAdminDto) {
    const data: Record<string, unknown> = { ...dto };

    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 12);
      delete data.password;
    }

    return this.repo.update(id, data);
  }

  async remove(id: string) {
    const admin = await this.repo.findById(id);
    if (!admin) throw new NotFoundException('Admin introuvable.');

    const total = await this.repo.count();
    if (total <= 1) {
      throw new ConflictException(
        'Impossible de supprimer le dernier administrateur.',
      );
    }

    return this.repo.delete(id);
  }
}