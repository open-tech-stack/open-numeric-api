import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { ServicesRepository } from './repositories/services.repository.js';
import type {
  CreateServiceCategoryDto,
  CreateServiceDto,
  CreateServiceItemDto,
  UpdateServiceCategoryDto,
  UpdateServiceDto,
  UpdateServiceItemDto,
} from './dto/index.js';
import type {
  ServiceCategoryResponse,
  ServiceItemResponse,
  ServiceResponse,
} from './types/service-response.type.js';
import type { Locale } from '../../common/types/locale.type.js';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(private readonly repo: ServicesRepository) {}

  // ================================================================
  // PUBLIC
  // ================================================================
  async findAllPublic(): Promise<ServiceResponse[]> {
    const items = await this.repo.findActive();
    return items.map((s) => this.toResponse(s));
  }

  async findBySlugPublic(slug: string): Promise<ServiceResponse> {
    const service = await this.repo.findBySlug(slug);
    if (!service || !service.isActive) {
      throw new NotFoundException('Service introuvable.');
    }
    return this.toResponse(service);
  }

  // ================================================================
  // ADMIN — Services
  // ================================================================
  async findAllAdmin(): Promise<ServiceResponse[]> {
    const items = await this.repo.findAll();
    return items.map((s) => this.toResponse(s));
  }

  async findById(id: string): Promise<ServiceResponse> {
    const service = await this.repo.findById(id);
    if (!service) throw new NotFoundException('Service introuvable.');
    return this.toResponse(service);
  }

  async createService(
    dto: CreateServiceDto,
    adminId: string,
  ): Promise<ServiceResponse> {
    const existingKey = await this.repo.findByKey(dto.key);
    if (existingKey) {
      throw new ConflictException(
        `Un service avec la clé "${dto.key}" existe déjà.`,
      );
    }
    const existingSlug = await this.repo.findBySlug(dto.slug);
    if (existingSlug) {
      throw new ConflictException(
        `Un service avec le slug "${dto.slug}" existe déjà.`,
      );
    }

    const { categories, translations, ...scalars } = dto;

    const created = await this.repo.create({
      ...scalars,
      isActive: dto.isActive ?? true,
      order: dto.order ?? 0,
      author: { connect: { id: adminId } },
      translations: {
        create: translations.map((t) => ({
          locale: t.locale,
          name: t.name,
          heroTitle: t.heroTitle ?? null,
          heroTitleHighlight: t.heroTitleHighlight ?? null,
          heroSubtitle: t.heroSubtitle ?? null,
        })),
      },
    });

    // Créer les catégories (avec items) si fournies
    if (categories && categories.length > 0) {
      for (const cat of categories) {
        await this.createCategoryInternal(created.id, cat);
      }
    }

    this.logger.log(`Service créé : ${created.key} par admin ${adminId}`);
    return this.findById(created.id);
  }

  async updateService(
    id: string,
    dto: UpdateServiceDto,
  ): Promise<ServiceResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Service introuvable.');

    if (dto.slug && dto.slug !== existing.slug) {
      const conflict = await this.repo.findBySlug(dto.slug);
      if (conflict) {
        throw new ConflictException(
          `Un service avec le slug "${dto.slug}" existe déjà.`,
        );
      }
    }

    const { categories, translations, ...scalars } = dto;

    await this.repo.update(id, scalars);

    if (translations && translations.length > 0) {
      await this.repo.replaceTranslations(id, translations);
    }

    // ⚠️ On ne remplace PAS automatiquement les catégories :
    // elles ont leur propre cycle de vie via leurs endpoints dédiés.

    return this.findById(id);
  }

  async removeService(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Service introuvable.');
    await this.repo.delete(id);
    return { success: true };
  }

  // ================================================================
  // ADMIN — Catégories
  // ================================================================
  async createCategory(
    serviceId: string,
    dto: CreateServiceCategoryDto,
  ): Promise<ServiceCategoryResponse> {
    const service = await this.repo.findById(serviceId);
    if (!service) throw new NotFoundException('Service introuvable.');

    const created = await this.createCategoryInternal(serviceId, dto);
    return this.categoryToResponse(created);
  }

  async updateCategory(
    id: string,
    dto: UpdateServiceCategoryDto,
  ): Promise<ServiceCategoryResponse> {
    const existing = await this.repo.findCategoryById(id);
    if (!existing) throw new NotFoundException('Catégorie introuvable.');

    const { items, translations, ...scalars } = dto;

    await this.repo.updateCategory(id, scalars);

    if (translations && translations.length > 0) {
      await this.repo.replaceCategoryTranslations(id, translations);
    }

    const fresh = await this.repo.findCategoryById(id);
    return this.categoryToResponse(fresh!);
  }

  async removeCategory(id: string) {
    const existing = await this.repo.findCategoryById(id);
    if (!existing) throw new NotFoundException('Catégorie introuvable.');
    await this.repo.deleteCategory(id);
    return { success: true };
  }

  // ================================================================
  // ADMIN — Items
  // ================================================================
  async createItem(
    categoryId: string,
    dto: CreateServiceItemDto,
  ): Promise<ServiceItemResponse> {
    const category = await this.repo.findCategoryById(categoryId);
    if (!category) throw new NotFoundException('Catégorie introuvable.');

    const created = await this.repo.createItem({
      key: dto.key,
      image: dto.image ?? null,
      icon: dto.icon ?? null,
      order: dto.order ?? 0,
      serviceCategory: { connect: { id: categoryId } },
      translations: {
        create: dto.translations.map((t) => ({
          locale: t.locale,
          name: t.name,
          description: t.description ?? null,
        })),
      },
    });
    return this.itemToResponse(created);
  }

  async updateItem(
    id: string,
    dto: UpdateServiceItemDto,
  ): Promise<ServiceItemResponse> {
    const existing = await this.repo.findItemById(id);
    if (!existing) throw new NotFoundException('Item introuvable.');

    const { translations, ...scalars } = dto;

    await this.repo.updateItem(id, scalars);

    if (translations && translations.length > 0) {
      await this.repo.replaceItemTranslations(id, translations);
    }

    const fresh = await this.repo.findItemById(id);
    return this.itemToResponse(fresh!);
  }

  async removeItem(id: string) {
    const existing = await this.repo.findItemById(id);
    if (!existing) throw new NotFoundException('Item introuvable.');
    await this.repo.deleteItem(id);
    return { success: true };
  }

  // ================================================================
  // HELPERS
  // ================================================================
  private async createCategoryInternal(
    serviceId: string,
    dto: CreateServiceCategoryDto,
  ) {
    return this.repo.createCategory({
      key: dto.key,
      icon: dto.icon,
      accent: dto.accent,
      order: dto.order ?? 0,
      service: { connect: { id: serviceId } },
      translations: {
        create: dto.translations.map((t) => ({
          locale: t.locale,
          name: t.name,
          description: t.description ?? null,
        })),
      },
      ...(dto.items && dto.items.length > 0 && {
        items: {
          create: dto.items.map((it) => ({
            key: it.key,
            image: it.image ?? null,
            icon: it.icon ?? null,
            order: it.order ?? 0,
            translations: {
              create: it.translations.map((t) => ({
                locale: t.locale,
                name: t.name,
                description: t.description ?? null,
              })),
            },
          })),
        },
      }),
    });
  }

  // ================================================================
  // MAPPERS
  // ================================================================
  private itemToResponse(item: {
    id: string;
    key: string;
    image: string | null;
    icon: string | null;
    order: number;
    translations: { locale: string; name: string; description: string | null }[];
  }): ServiceItemResponse {
    return {
      id: item.id,
      key: item.key,
      image: item.image,
      icon: item.icon,
      order: item.order,
      translations: item.translations.map((t) => ({
        locale: t.locale as Locale,
        name: t.name,
        description: t.description,
      })),
    };
  }

  private categoryToResponse(category: {
    id: string;
    key: string;
    icon: string;
    accent: string;
    order: number;
    translations: { locale: string; name: string; description: string | null }[];
    items: {
      id: string;
      key: string;
      image: string | null;
      icon: string | null;
      order: number;
      translations: { locale: string; name: string; description: string | null }[];
    }[];
  }): ServiceCategoryResponse {
    return {
      id: category.id,
      key: category.key,
      icon: category.icon,
      accent: category.accent,
      order: category.order,
      translations: category.translations.map((t) => ({
        locale: t.locale as Locale,
        name: t.name,
        description: t.description,
      })),
      items: category.items.map((i) => this.itemToResponse(i)),
    };
  }

  private toResponse(service: {
    id: string;
    key: string;
    slug: string;
    href: string;
    icon: string;
    accent: string;
    order: number;
    isActive: boolean;
    translations: {
      locale: string;
      name: string;
      heroTitle: string | null;
      heroTitleHighlight: string | null;
      heroSubtitle: string | null;
    }[];
    categories: {
      id: string;
      key: string;
      icon: string;
      accent: string;
      order: number;
      translations: { locale: string; name: string; description: string | null }[];
      items: {
        id: string;
        key: string;
        image: string | null;
        icon: string | null;
        order: number;
        translations: { locale: string; name: string; description: string | null }[];
      }[];
    }[];
  }): ServiceResponse {
    return {
      id: service.id,
      key: service.key,
      slug: service.slug,
      href: service.href,
      icon: service.icon,
      accent: service.accent,
      order: service.order,
      isActive: service.isActive,
      translations: service.translations.map((t) => ({
        locale: t.locale as Locale,
        name: t.name,
        heroTitle: t.heroTitle,
        heroTitleHighlight: t.heroTitleHighlight,
        heroSubtitle: t.heroSubtitle,
      })),
      categories: service.categories.map((c) => this.categoryToResponse(c)),
    };
  }
}