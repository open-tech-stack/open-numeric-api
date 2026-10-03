import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { ContactRepository } from './repositories/contact.repository.js';
import type {
  CreateContactDto,
  QueryContactsDto,
  UpdateContactStatusDto,
} from './dto/index.js';
import type {
  ContactSubmissionResponse,
  PaginatedContacts,
} from './types/contact-response.type.js';

interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly repo: ContactRepository) {}

  // ================================================================
  // PUBLIC — soumission
  // ================================================================
  async create(
    dto: CreateContactDto,
    meta: RequestMeta,
  ): Promise<{ success: true; id: string }> {
    const created = await this.repo.create({
      name: dto.name,
      email: dto.email,
      subject: dto.subject,
      message: dto.message,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      status: 'NEW',
    });

    this.logger.log(
      `Nouvelle soumission contact : ${created.id} (${dto.email})`,
    );

    return { success: true, id: created.id };
  }

  // ================================================================
  // ADMIN — liste paginée
  // ================================================================
  async findAllAdmin(query: QueryContactsDto): Promise<PaginatedContacts> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { subject: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const { items, total } = await this.repo.findAll({
      where,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((c) => this.toResponse(c)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findById(id: string): Promise<ContactSubmissionResponse> {
    const contact = await this.repo.findById(id);
    if (!contact) throw new NotFoundException('Message introuvable.');
    return this.toResponse(contact);
  }

  // ================================================================
  // ADMIN — modération
  // ================================================================
  async updateStatus(
    id: string,
    dto: UpdateContactStatusDto,
  ): Promise<ContactSubmissionResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Message introuvable.');

    const updated = await this.repo.update(id, { status: dto.status });
    return this.toResponse(updated);
  }

  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Message introuvable.');
    await this.repo.delete(id);
    return { success: true };
  }

  // ================================================================
  // MAPPER
  // ================================================================
  private toResponse(contact: {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    status: string;
    ip: string | null;
    userAgent: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ContactSubmissionResponse {
    return {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      subject: contact.subject,
      message: contact.message,
      status: contact.status as any,
      ip: contact.ip,
      userAgent: contact.userAgent,
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
    };
  }
}