import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import type { Admin, AdminRole } from '../../generated/prisma/client.js';
import { AdminRepository } from './repositories/admin.repository.js';
import { CreateAdminDto } from './dto/create-admin.dto.js';
import { UpdateAdminDto } from './dto/update-admin.dto.js';
import type { AdminResponse } from './types/index.js';

@Injectable()
export class AdminService {
  constructor(private readonly repo: AdminRepository) {}

  // ----------------------------------------------------------------
  // CREATE
  // ----------------------------------------------------------------
  async create(dto: CreateAdminDto): Promise<AdminResponse> {
    const existing = await this.repo.findByUsername(dto.username);
    if (existing) {
      throw new ConflictException('Ce nom d’utilisateur existe déjà.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const created = await this.repo.create({
      username: dto.username,
      passwordHash,
      displayName: dto.displayName,
      email: dto.email,
      role: dto.role as AdminRole,
    });

    return this.toResponse(created);
  }

  // ----------------------------------------------------------------
  // READ
  // ----------------------------------------------------------------
  async findAll(): Promise<AdminResponse[]> {
    const items = await this.repo.findAll();
    return items.map((a) => this.toResponse(a));
  }

  async findById(id: string): Promise<AdminResponse> {
    const admin = await this.repo.findById(id);
    if (!admin) throw new NotFoundException('Admin introuvable.');
    return this.toResponse(admin);
  }

  // ----------------------------------------------------------------
  // UPDATE
  // ----------------------------------------------------------------
  async update(id: string, dto: UpdateAdminDto): Promise<AdminResponse> {
    // Vérifie l'existence
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Admin introuvable.');

    // Vérifie l'unicité du username s'il est modifié
    if (dto.username && dto.username !== existing.username) {
      const conflict = await this.repo.findByUsername(dto.username);
      if (conflict) {
        throw new ConflictException('Ce nom d’utilisateur existe déjà.');
      }
    }

    const data: Record<string, unknown> = { ...dto };

    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 12);
      delete data.password;
    }

    const updated = await this.repo.update(id, data);
    return this.toResponse(updated);
  }

  // ----------------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------------
  async remove(id: string): Promise<{ success: true }> {
    const admin = await this.repo.findById(id);
    if (!admin) throw new NotFoundException('Admin introuvable.');

    const total = await this.repo.count();
    if (total <= 1) {
      throw new ConflictException(
        'Impossible de supprimer le dernier administrateur.',
      );
    }

    await this.repo.delete(id);
    return { success: true };
  }

  // ----------------------------------------------------------------
  // MAPPER PRIVÉ
  // ----------------------------------------------------------------
  private toResponse(a: Admin): AdminResponse {
    return {
      id: a.id,
      username: a.username,
      displayName: a.displayName,
      email: a.email,
      role: a.role,
      lastLoginAt: a.lastLoginAt ? a.lastLoginAt.toISOString() : null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    };
  }
}