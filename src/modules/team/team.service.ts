import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { TeamRepository } from './repositories/team.repository.js';
import type {
  CreateTeamMemberDto,
  UpdateTeamMemberDto,
} from './dto/index.js';
import type { TeamMemberResponse } from './types/team-response.type.js';
import type { Locale } from '../../common/types/locale.type.js';

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(private readonly repo: TeamRepository) {}

  // ================================================================
  // PUBLIC
  // ================================================================
  async findAllPublic(): Promise<TeamMemberResponse[]> {
    const items = await this.repo.findActive();
    return items.map((m) => this.toResponse(m));
  }

  // ================================================================
  // ADMIN
  // ================================================================
  async findAllAdmin(): Promise<TeamMemberResponse[]> {
    const items = await this.repo.findAll();
    return items.map((m) => this.toResponse(m));
  }

  async findById(id: string): Promise<TeamMemberResponse> {
    const member = await this.repo.findById(id);
    if (!member) throw new NotFoundException('Membre introuvable.');
    return this.toResponse(member);
  }

  async create(
    dto: CreateTeamMemberDto,
    adminId: string,
  ): Promise<TeamMemberResponse> {
    const existing = await this.repo.findByKey(dto.key);
    if (existing) {
      throw new ConflictException(
        `Un membre avec la clé "${dto.key}" existe déjà.`,
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
          role: t.role,
          bio: t.bio,
        })),
      },
    });

    this.logger.log(`Membre créé : ${created.key} par admin ${adminId}`);
    return this.toResponse(created);
  }

  async update(
    id: string,
    dto: UpdateTeamMemberDto,
  ): Promise<TeamMemberResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Membre introuvable.');

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
    if (!existing) throw new NotFoundException('Membre introuvable.');
    await this.repo.delete(id);
    return { success: true };
  }

  // ================================================================
  // MAPPER
  // ================================================================
  private toResponse(member: {
    id: string;
    key: string;
    image: string;
    linkedin: string | null;
    twitter: string | null;
    order: number;
    isActive: boolean;
    translations: {
      locale: string;
      name: string;
      role: string;
      bio: string;
    }[];
  }): TeamMemberResponse {
    return {
      id: member.id,
      key: member.key,
      image: member.image,
      linkedin: member.linkedin,
      twitter: member.twitter,
      order: member.order,
      isActive: member.isActive,
      translations: member.translations.map((t) => ({
        locale: t.locale as Locale,
        name: t.name,
        role: t.role,
        bio: t.bio,
      })),
    };
  }
}