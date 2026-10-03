import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { SocialsRepository } from './repositories/socials.repository.js';
import type {
  CreateSocialDto,
  UpdateSocialDto,
} from './dto/index.js';
import type { SocialResponse } from './types/social-response.type.js';
import type { Locale } from '../../common/types/locale.type.js';

@Injectable()
export class SocialsService {
  private readonly logger = new Logger(SocialsService.name);

  constructor(private readonly repo: SocialsRepository) {}

  // ================================================================
  // PUBLIC
  // ================================================================
  async findAllPublic(): Promise<SocialResponse[]> {
    const items = await this.repo.findActive();
    return items.map((s) => this.toResponse(s));
  }

  // ================================================================
  // ADMIN
  // ================================================================
  async findAllAdmin(): Promise<SocialResponse[]> {
    const items = await this.repo.findAll();
    return items.map((s) => this.toResponse(s));
  }

  async findById(id: string): Promise<SocialResponse> {
    const social = await this.repo.findById(id);
    if (!social) throw new NotFoundException('Réseau social introuvable.');
    return this.toResponse(social);
  }

  async create(
    dto: CreateSocialDto,
    adminId: string,
  ): Promise<SocialResponse> {
    const existing = await this.repo.findByKey(dto.key);
    if (existing) {
      throw new ConflictException(
        `Un réseau social avec la clé "${dto.key}" existe déjà.`,
      );
    }

    const { translations, ...scalars } = dto;

    const created = await this.repo.create({
      ...scalars,
      order: dto.order ?? 0,
      isActive: dto.isActive ?? true,
      author: { connect: { id: adminId } },
      translations: {
        create: translations.map((t) => ({
          locale: t.locale,
          name: t.name,
        })),
      },
    });

    this.logger.log(`Réseau social créé : ${created.key} par admin ${adminId}`);
    return this.toResponse(created);
  }

  async update(
    id: string,
    dto: UpdateSocialDto,
  ): Promise<SocialResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Réseau social introuvable.');

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
    if (!existing) throw new NotFoundException('Réseau social introuvable.');
    await this.repo.delete(id);
    return { success: true };
  }

  // ================================================================
  // MAPPER
  // ================================================================
  private toResponse(social: {
    id: string;
    key: string;
    icon: string;
    url: string;
    hoverColor: string;
    order: number;
    isActive: boolean;
    translations: { locale: string; name: string }[];
  }): SocialResponse {
    return {
      id: social.id,
      key: social.key,
      icon: social.icon,
      url: social.url,
      hoverColor: social.hoverColor,
      order: social.order,
      isActive: social.isActive,
      translations: social.translations.map((t) => ({
        locale: t.locale as Locale,
        name: t.name,
      })),
    };
  }
}