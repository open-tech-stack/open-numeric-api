import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { QuoteRepository } from './repositories/quote.repository.js';
import type {
  CreateQuoteDto,
  QueryQuotesDto,
  UpdateQuoteStatusDto,
} from './dto/index.js';
import type {
  PaginatedQuotes,
  QuoteRequestResponse,
} from './types/quote-response.type.js';

interface RequestMeta {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class QuoteService {
  private readonly logger = new Logger(QuoteService.name);

  constructor(private readonly repo: QuoteRepository) {}

  // ================================================================
  // PUBLIC — soumission
  // ================================================================
  async create(
    dto: CreateQuoteDto,
    meta: RequestMeta,
  ): Promise<{ success: true; id: string }> {
    const created = await this.repo.create({
      name: dto.name,
      company: dto.company ?? null,
      email: dto.email,
      phone: dto.phone ?? null,
      projectType: dto.projectType,
      budget: dto.budget,
      timeline: dto.timeline,
      description: dto.description,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
      status: 'NEW',
    });

    this.logger.log(
      `Nouvelle demande de devis : ${created.id} (${dto.email} — ${dto.projectType})`,
    );

    return { success: true, id: created.id };
  }

  // ================================================================
  // ADMIN — liste paginée
  // ================================================================
  async findAllAdmin(query: QueryQuotesDto): Promise<PaginatedQuotes> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.projectType) where.projectType = query.projectType;

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { company: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const { items, total } = await this.repo.findAll({
      where,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((q) => this.toResponse(q)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findById(id: string): Promise<QuoteRequestResponse> {
    const quote = await this.repo.findById(id);
    if (!quote) throw new NotFoundException('Demande de devis introuvable.');
    return this.toResponse(quote);
  }

  // ================================================================
  // ADMIN — modération
  // ================================================================
  async updateStatus(
    id: string,
    dto: UpdateQuoteStatusDto,
  ): Promise<QuoteRequestResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Demande de devis introuvable.');

    const updated = await this.repo.update(id, { status: dto.status });
    return this.toResponse(updated);
  }

  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Demande de devis introuvable.');
    await this.repo.delete(id);
    return { success: true };
  }

  // ================================================================
  // MAPPER
  // ================================================================
  private toResponse(quote: {
    id: string;
    name: string;
    company: string | null;
    email: string;
    phone: string | null;
    projectType: string;
    budget: string;
    timeline: string;
    description: string;
    status: string;
    ip: string | null;
    userAgent: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): QuoteRequestResponse {
    return {
      id: quote.id,
      name: quote.name,
      company: quote.company,
      email: quote.email,
      phone: quote.phone,
      projectType: quote.projectType,
      budget: quote.budget,
      timeline: quote.timeline,
      description: quote.description,
      status: quote.status as any,
      ip: quote.ip,
      userAgent: quote.userAgent,
      createdAt: quote.createdAt.toISOString(),
      updatedAt: quote.updatedAt.toISOString(),
    };
  }
}