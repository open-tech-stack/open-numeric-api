import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { ProjectsRepository } from './repositories/projects.repository.js';
import type {
  CreateProjectDto,
  QueryProjectsDto,
  UpdateProjectDto,
} from './dto/index.js';
import type {
  PaginatedProjects,
  ProjectResponse,
} from './types/project-response.type.js';
import type { Locale } from '../../common/types/locale.type.js';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly repo: ProjectsRepository) {}

  // ================================================================
  // PUBLIC — liste paginée + filtres
  // ================================================================
  async findAllPublic(query: QueryProjectsDto): Promise<PaginatedProjects> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 9;

    const where: Record<string, unknown> = { isActive: true };

    if (query.category?.length) where.category = { in: query.category };
    if (query.scope?.length) where.scope = { in: query.scope };
    if (query.status) where.status = query.status;
    if (query.year?.length) where.year = { in: query.year };
    if (query.tech?.length) where.tech = { hasSome: query.tech };
    if (query.featured) where.featured = true;

    if (query.search) {
      where.translations = {
        some: {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        },
      };
    }

    const { items, total } = await this.repo.findAll({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ featured: 'desc' }, { year: 'desc' }, { order: 'asc' }],
    });

    return {
      items: items.map((p) => this.toResponse(p)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findBySlugPublic(slug: string): Promise<ProjectResponse> {
    const project = await this.repo.findBySlug(slug);
    if (!project || !project.isActive) {
      throw new NotFoundException('Projet introuvable.');
    }
    return this.toResponse(project);
  }

  async findSimilarPublic(slug: string): Promise<ProjectResponse[]> {
    const project = await this.repo.findBySlug(slug);
    if (!project) throw new NotFoundException('Projet introuvable.');
    const similar = await this.repo.findSimilar(slug, project.category, 3);
    return similar.map((p) => this.toResponse(p));
  }

  // ================================================================
  // ADMIN
  // ================================================================
  async findAllAdmin(query: QueryProjectsDto): Promise<PaginatedProjects> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Record<string, unknown> = {};
    if (!query.includeInactive) where.isActive = true;

    if (query.category?.length) where.category = { in: query.category };
    if (query.scope?.length) where.scope = { in: query.scope };
    if (query.status) where.status = query.status;
    if (query.year?.length) where.year = { in: query.year };
    if (query.tech?.length) where.tech = { hasSome: query.tech };
    if (query.featured) where.featured = true;

    if (query.search) {
      where.translations = {
        some: {
          OR: [
            { title: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        },
      };
    }

    const { items, total } = await this.repo.findAll({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ updatedAt: 'desc' }],
    });

    return {
      items: items.map((p) => this.toResponse(p)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findById(id: string): Promise<ProjectResponse> {
    const project = await this.repo.findById(id);
    if (!project) throw new NotFoundException('Projet introuvable.');
    return this.toResponse(project);
  }

  // ----------------------------------------------------------------
  // CREATE
  // ----------------------------------------------------------------
  async create(
    dto: CreateProjectDto,
    adminId: string,
  ): Promise<ProjectResponse> {
    const existing = await this.repo.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException(
        `Un projet avec le slug "${dto.slug}" existe déjà.`,
      );
    }

    const { translations, gallery, features, links, clientId, ...scalars } = dto;

    const created = await this.repo.create({
      ...scalars,
      status: dto.status ?? 'COMPLETED',
      featured: dto.featured ?? false,
      order: dto.order ?? 0,
      isActive: dto.isActive ?? true,
      ...(clientId && { client: { connect: { id: clientId } } }),
      author: { connect: { id: adminId } },
      translations: {
        create: translations.map((t) => ({
          locale: t.locale,
          title: t.title,
          description: t.description,
          longDescription: t.longDescription ?? null,
        })),
      },
      ...(gallery && gallery.length > 0 && {
        gallery: {
          create: gallery.map((g) => ({
            src: g.src,
            order: g.order ?? 0,
            translations: {
              create: g.translations.map((t) => ({
                locale: t.locale,
                caption: t.caption,
              })),
            },
          })),
        },
      }),
      ...(features && features.length > 0 && {
        features: {
          create: features.map((f) => ({
            key: f.key,
            icon: f.icon,
            order: f.order ?? 0,
            translations: {
              create: f.translations.map((t) => ({
                locale: t.locale,
                title: t.title,
                description: t.description,
              })),
            },
          })),
        },
      }),
      ...(links && links.length > 0 && {
        links: {
          create: links.map((l) => ({
            type: l.type,
            url: l.url,
            order: l.order ?? 0,
          })),
        },
      }),
    });

    this.logger.log(`Projet créé : ${created.slug} par admin ${adminId}`);
    return this.toResponse(created);
  }

  // ----------------------------------------------------------------
  // UPDATE — remplace les sous-ressources si fournies
  // ----------------------------------------------------------------
  async update(id: string, dto: UpdateProjectDto): Promise<ProjectResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Projet introuvable.');

    const { translations, gallery, features, links, clientId, ...scalars } = dto;

    // Scalaires + client
    await this.repo.update(id, {
      ...scalars,
      ...(clientId !== undefined && {
        client: clientId ? { connect: { id: clientId } } : { disconnect: true },
      }),
    });

    // Sous-ressources (remplacement complet)
    if (translations && translations.length > 0) {
      await this.repo.replaceTranslations(id, translations);
    }
    if (gallery !== undefined) {
      await this.repo.replaceGallery(id, gallery);
    }
    if (features !== undefined) {
      await this.repo.replaceFeatures(id, features);
    }
    if (links !== undefined) {
      await this.repo.replaceLinks(id, links);
    }

    return this.findById(id);
  }

  // ----------------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------------
  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Projet introuvable.');
    await this.repo.delete(id);
    return { success: true };
  }

  // ----------------------------------------------------------------
  // Mapper Prisma → Response
  // ----------------------------------------------------------------
  private toResponse(project: {
    id: string;
    slug: string;
    cover: string;
    heroImage: string | null;
    category: string;
    scope: string;
    status: string;
    year: number;
    tech: string[];
    tags: string[];
    featured: boolean;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    client: {
      id: string;
      name: string;
      logo: string;
      url: string | null;
    } | null;
    translations: {
      locale: string;
      title: string;
      description: string;
      longDescription: string | null;
    }[];
    gallery: {
      id: string;
      src: string;
      order: number;
      translations: { locale: string; caption: string }[];
    }[];
    features: {
      id: string;
      key: string;
      icon: string;
      order: number;
      translations: { locale: string; title: string; description: string }[];
    }[];
    links: { id: string; type: string; url: string; order: number }[];
  }): ProjectResponse {
    return {
      id: project.id,
      slug: project.slug,
      cover: project.cover,
      heroImage: project.heroImage,
      category: project.category as any,
      scope: project.scope as any,
      status: project.status as any,
      year: project.year,
      tech: project.tech,
      tags: project.tags,
      featured: project.featured,
      order: project.order,
      isActive: project.isActive,
      client: project.client,
      translations: project.translations.map((t) => ({
        locale: t.locale as Locale,
        title: t.title,
        description: t.description,
        longDescription: t.longDescription,
      })),
      gallery: project.gallery.map((g) => ({
        id: g.id,
        src: g.src,
        order: g.order,
        translations: g.translations.map((t) => ({
          locale: t.locale as Locale,
          caption: t.caption,
        })),
      })),
      features: project.features.map((f) => ({
        id: f.id,
        key: f.key,
        icon: f.icon,
        order: f.order,
        translations: f.translations.map((t) => ({
          locale: t.locale as Locale,
          title: t.title,
          description: t.description,
        })),
      })),
      links: project.links.map((l) => ({
        id: l.id,
        type: l.type as any,
        url: l.url,
        order: l.order,
      })),
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}