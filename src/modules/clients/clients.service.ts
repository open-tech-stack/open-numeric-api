import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { ClientsRepository } from './repositories/clients.repository.js';
import type {
  CreateClientDto,
  UpdateClientDto,
} from './dto/index.js';
import type { ClientResponse } from './types/client-response.type.js';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(private readonly repo: ClientsRepository) {}

  // ================================================================
  // PUBLIC
  // ================================================================
  async findAllPublic(): Promise<ClientResponse[]> {
    const items = await this.repo.findActive();
    return items.map((c) => this.toResponse(c));
  }

  // ================================================================
  // ADMIN
  // ================================================================
  async findAllAdmin(): Promise<ClientResponse[]> {
    const items = await this.repo.findAll();
    return items.map((c) => this.toResponse(c));
  }

  async findById(id: string): Promise<ClientResponse> {
    const client = await this.repo.findById(id);
    if (!client) throw new NotFoundException('Client introuvable.');
    return this.toResponse(client);
  }

  async create(
    dto: CreateClientDto,
    adminId: string,
  ): Promise<ClientResponse> {
    const created = await this.repo.create({
      name: dto.name,
      logo: dto.logo,
      url: dto.url ?? null,
      order: dto.order ?? 0,
      isActive: dto.isActive ?? true,
      author: { connect: { id: adminId } },
    });

    this.logger.log(`Client créé : ${created.name} par admin ${adminId}`);
    return this.toResponse(created);
  }

  async update(id: string, dto: UpdateClientDto): Promise<ClientResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Client introuvable.');

    const updated = await this.repo.update(id, dto);
    return this.toResponse(updated);
  }

  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Client introuvable.');

    // Vérifier qu'aucun projet n'est associé
    const projectCount = await this.repo.countProjects(id);
    if (projectCount > 0) {
      throw new ConflictException(
        `Impossible de supprimer ce client : ${projectCount} projet(s) y sont associés. Détachez-les d'abord.`,
      );
    }

    await this.repo.delete(id);
    return { success: true };
  }

  // ================================================================
  // MAPPER
  // ================================================================
  private toResponse(client: {
    id: string;
    name: string;
    logo: string;
    url: string | null;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): ClientResponse {
    return {
      id: client.id,
      name: client.name,
      logo: client.logo,
      url: client.url,
      order: client.order,
      isActive: client.isActive,
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    };
  }
}