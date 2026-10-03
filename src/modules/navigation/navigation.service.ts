import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { NavRepository } from './repositories/nav.repository.js';
import type {
  CreateNavItemDto,
  ReorderNavDto,
  UpdateNavItemDto,
} from './dto/index.js';
import type {
  NavResponse,
  NavTranslation,
} from './types/nav-response.type.js';
import type { Locale } from '../../common/types/locale.type.js';

@Injectable()
export class NavigationService {
  private readonly logger = new Logger(NavigationService.name);

  constructor(private readonly repo: NavRepository) {}

  // ----------------------------------------------------------------
  // PUBLIC — arbre complet (actifs seulement)
  // ----------------------------------------------------------------
  async getPublicTree(): Promise<NavResponse[]> {
    const items = await this.repo.findAll();
    const active = items.filter((i) => i.isActive);
    return this.buildTree(active);
  }

  // ----------------------------------------------------------------
  // ADMIN — liste à plat (tous, même inactifs)
  // ----------------------------------------------------------------
  async findAllFlat(): Promise<NavResponse[]> {
    const items = await this.repo.findAll();
    return items.map((i) => this.toResponse(i, []));
  }

  async findById(id: string): Promise<NavResponse> {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException('NavItem introuvable.');
    return this.toResponse(item, []);
  }

  // ----------------------------------------------------------------
  // CREATE
  // ----------------------------------------------------------------
  async create(dto: CreateNavItemDto, adminId: string): Promise<NavResponse> {
    const existing = await this.repo.findByKey(dto.key);
    if (existing) {
      throw new ConflictException(
        `Un NavItem avec la clé "${dto.key}" existe déjà.`,
      );
    }

    // Vérifier que le parent existe si fourni
    if (dto.parentId) {
      const parent = await this.repo.findById(dto.parentId);
      if (!parent) {
        throw new NotFoundException('NavItem parent introuvable.');
      }
    }

    const created = await this.repo.create({
      key: dto.key,
      href: dto.href,
      order: dto.order ?? 0,
      isActive: dto.isActive ?? true,
      ...(dto.parentId && { parent: { connect: { id: dto.parentId } } }),
      author: { connect: { id: adminId } },
      translations: {
        create: dto.translations.map((t) => ({
          locale: t.locale,
          label: t.label,
        })),
      },
    });

    this.logger.log(
      `NavItem créé : ${created.key} par admin ${adminId}`,
    );

    return this.toResponse(created, []);
  }

  // ----------------------------------------------------------------
  // UPDATE
  // ----------------------------------------------------------------
  async update(
    id: string,
    dto: UpdateNavItemDto,
  ): Promise<NavResponse> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('NavItem introuvable.');

    // Vérifier que le nouveau parent existe et n'est pas soi-même
    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new ConflictException(
          'Un NavItem ne peut pas être son propre parent.',
        );
      }
      if (dto.parentId) {
        const parent = await this.repo.findById(dto.parentId);
        if (!parent) {
          throw new NotFoundException('NavItem parent introuvable.');
        }
      }
    }

    const { translations, ...scalars } = dto;

    // Mise à jour des champs scalaires
    const updated = await this.repo.update(id, {
      ...scalars,
      ...(dto.parentId !== undefined && {
        parent: dto.parentId
          ? { connect: { id: dto.parentId } }
          : { disconnect: true },
      }),
    });

    // Remplacement complet des traductions si fournies
    if (translations && translations.length > 0) {
      await this.repo.replaceTranslations(id, translations);
    }

    // Recharge pour avoir les traductions à jour
    const fresh = await this.repo.findById(updated.id);
    return this.toResponse(fresh!, []);
  }

  // ----------------------------------------------------------------
  // DELETE (les enfants sont supprimés en cascade via Prisma)
  // ----------------------------------------------------------------
  async remove(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('NavItem introuvable.');

    await this.repo.delete(id);
    return { success: true };
  }

  // ----------------------------------------------------------------
  // REORDER
  // ----------------------------------------------------------------
  async reorder(dto: ReorderNavDto) {
    // Vérifier que tous les items existent
    for (const it of dto.items) {
      const exists = await this.repo.findById(it.id);
      if (!exists) {
        throw new NotFoundException(`NavItem ${it.id} introuvable.`);
      }
    }

    await this.repo.reorderMany(dto.items);
    this.logger.log(`Réordonnancement : ${dto.items.length} items`);

    return this.getPublicTree();
  }

  // ----------------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------------
  private buildTree(
    flat: Awaited<ReturnType<NavRepository['findAll']>>,
  ): NavResponse[] {
    const map = new Map<string, NavResponse>();

    // 1er passage : créer tous les nœuds sans enfants
    for (const item of flat) {
      map.set(item.id, this.toResponse(item, []));
    }

    // 2e passage : attacher les enfants à leur parent
    const roots: NavResponse[] = [];
    for (const item of flat) {
      const node = map.get(item.id)!;
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    // Tri par `order` à chaque niveau
    const sortRecursive = (nodes: NavResponse[]) => {
      nodes.sort((a, b) => a.order - b.order);
      for (const n of nodes) sortRecursive(n.children);
    };
    sortRecursive(roots);

    return roots;
  }

  private toResponse(
    item: {
      id: string;
      key: string;
      href: string;
      order: number;
      isActive: boolean;
      parentId: string | null;
      translations: { locale: string; label: string }[];
    },
    children: NavResponse[],
  ): NavResponse {
    return {
      id: item.id,
      key: item.key,
      href: item.href,
      order: item.order,
      isActive: item.isActive,
      parentId: item.parentId,
      translations: item.translations.map(
        (t): NavTranslation => ({
          locale: t.locale as Locale,
          label: t.label,
        }),
      ),
      children,
    };
  }
}