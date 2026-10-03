import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { TestimonialsRepository } from './repositories/testimonials.repository.js';
import type {
  CreateTestimonialDto,
  UpdateTestimonialDto,
} from './dto/index.js';
import type { TestimonialResponse } from './types/testimonial-response.type.js';
import type { Locale } from '../../common/types/locale.type.js';

@Injectable()
export class TestimonialsService {
  private readonly logger = new Logger(TestimonialsService.name);

  constructor(private readonly repo: TestimonialsRepository) {}

  // ================================================================
  // PUBLIC
  // ================================================================
  async findAllPublic(): Promise<TestimonialResponse[]> {
    const items = await this.repo.findActive();
    return items.map((t) => this.toResponse(t));
  }

  // ================================================================
  // ADMIN
  // ================================================================
  async findAllAdmin(): Promise<TestimonialResponse[]> {
    const items = await this.repo.findAll();
    return items.map((t) => this.toResponse(t));
  }

  async findById(id: string): Promise<TestimonialResponse> {
    const testimonial = await this.repo.findById(id);
    if (!testimonial) throw new NotFoundException('Témoignage introuvable.');
    return this.toResponse(testimonial);
  }

  async create(
    dto: CreateTestimonialDto,
    adminId: string,
  ): Promise<TestimonialResponse> {
    const existing = await this.repo.findByKey(dto.key);
    if (existing) {
      throw new ConflictException(
        `Un témoignage avec la clé "${dto.key}" existe déjà.`,
      );
    }

    const { translations, ...scalars } = dto;

    const created = await this.repo.create({
      ...scalars,
      rating: dto.rating ?? 5,
      order: dto.order ?? 0,
      isActive: dto.isActive ?? true,
      author: { connect: { id: adminId } },
      translations: {
        create: translations.map((t) => ({
          locale: t.locale,
          quote: t.quote,
          author: t.author,
          company: t.company,
        })),
      },
    });

    this.logger.log(`Témoignage créé : ${created.key} par admin ${adminId}`);
    return this.toResponse(created);
  }

  async update(
    id: string,
    dto: UpdateTestimonialDto,
  ): Promise<TestimonialResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Témoignage introuvable.');

    const { translations, ...scalars } = dto;

    await this.repo.update(id, scalars);

    if (translations && translations.length > 0) {
      await this.repo.replaceTranslations(id, translations);
    }

    const fresh = await this.repo.findById(id);
    return this.toResponse(fresh!);
  }

  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Témoignage introuvable.');
    await this.repo.delete(id);
    return { success: true };
  }

  // ================================================================
  // MAPPER
  // ================================================================
  private toResponse(testimonial: {
    id: string;
    key: string;
    image: string;
    rating: number;
    order: number;
    isActive: boolean;
    translations: {
      locale: string;
      quote: string;
      author: string;
      company: string;
    }[];
  }): TestimonialResponse {
    return {
      id: testimonial.id,
      key: testimonial.key,
      image: testimonial.image,
      rating: testimonial.rating,
      order: testimonial.order,
      isActive: testimonial.isActive,
      translations: testimonial.translations.map((t) => ({
        locale: t.locale as Locale,
        quote: t.quote,
        author: t.author,
        company: t.company,
      })),
    };
  }
}