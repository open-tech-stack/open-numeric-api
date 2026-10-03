import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';
import type { QuerySearchDto } from './dto/query-search.dto.js';
import type {
  SearchResponse,
  SearchResult,
  SearchResultType,
} from './types/search-response.type.js';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async search(dto: QuerySearchDto): Promise<SearchResponse> {
    const q = dto.q.trim();
    const locale = dto.locale ?? 'fr';
    const limit = dto.limit ?? 20;
    const types = dto.types;

    const shouldSearch = (type: SearchResultType) =>
      !types || types.length === 0 || types.includes(type);

    // ============================================================
    // Requêtes parallèles par type
    // ============================================================
    const [
      projects,
      services,
      team,
      clients,
      testimonials,
      navItems,
    ] = await Promise.all([
      shouldSearch('project')
        ? this.prisma.project.findMany({
            where: {
              isActive: true,
              translations: {
                some: {
                  locale,
                  OR: [
                    { title: { contains: q, mode: 'insensitive' } },
                    { description: { contains: q, mode: 'insensitive' } },
                    { longDescription: { contains: q, mode: 'insensitive' } },
                  ],
                },
              },
            },
            include: {
              translations: { where: { locale } },
            },
            take: limit,
          })
        : Promise.resolve([]),

      shouldSearch('service')
        ? this.prisma.service.findMany({
            where: {
              isActive: true,
              translations: {
                some: {
                  locale,
                  OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { heroTitle: { contains: q, mode: 'insensitive' } },
                    { heroSubtitle: { contains: q, mode: 'insensitive' } },
                  ],
                },
              },
            },
            include: {
              translations: { where: { locale } },
            },
            take: limit,
          })
        : Promise.resolve([]),

      shouldSearch('team')
        ? this.prisma.teamMember.findMany({
            where: {
              isActive: true,
              translations: {
                some: {
                  locale,
                  OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { role: { contains: q, mode: 'insensitive' } },
                    { bio: { contains: q, mode: 'insensitive' } },
                  ],
                },
              },
            },
            include: {
              translations: { where: { locale } },
            },
            take: limit,
          })
        : Promise.resolve([]),

      shouldSearch('client')
        ? this.prisma.client.findMany({
            where: {
              isActive: true,
              name: { contains: q, mode: 'insensitive' },
            },
            take: limit,
          })
        : Promise.resolve([]),

      shouldSearch('testimonial')
        ? this.prisma.testimonial.findMany({
            where: {
              isActive: true,
              translations: {
                some: {
                  locale,
                  OR: [
                    { quote: { contains: q, mode: 'insensitive' } },
                    { author: { contains: q, mode: 'insensitive' } },
                    { company: { contains: q, mode: 'insensitive' } },
                  ],
                },
              },
            },
            include: {
              translations: { where: { locale } },
            },
            take: limit,
          })
        : Promise.resolve([]),

      shouldSearch('nav')
        ? this.prisma.navItem.findMany({
            where: {
              isActive: true,
              translations: {
                some: {
                  locale,
                  label: { contains: q, mode: 'insensitive' },
                },
              },
            },
            include: {
              translations: { where: { locale } },
            },
            take: limit,
          })
        : Promise.resolve([]),
    ]);

    // ============================================================
    // Construction des résultats unifiés
    // ============================================================
    const results: SearchResult[] = [];

    for (const p of projects) {
      const tr = p.translations[0];
      if (!tr) continue;
      results.push({
        type: 'project',
        id: p.id,
        slug: p.slug,
        title: tr.title,
        excerpt: tr.description.slice(0, 140),
        url: `/portfolio/${p.slug}`,
        locale,
        score: this.score(q, [tr.title, tr.description]),
      });
    }

    for (const s of services) {
      const tr = s.translations[0];
      if (!tr) continue;
      results.push({
        type: 'service',
        id: s.id,
        slug: s.slug,
        title: tr.name,
        excerpt: tr.heroSubtitle?.slice(0, 140),
        url: s.href,
        locale,
        score: this.score(q, [tr.name, tr.heroSubtitle ?? '']),
      });
    }

    for (const m of team) {
      const tr = m.translations[0];
      if (!tr) continue;
      results.push({
        type: 'team',
        id: m.id,
        slug: m.key,
        title: tr.name,
        excerpt: `${tr.role} — ${tr.bio.slice(0, 100)}`,
        url: `/a-propos#team`,
        locale,
        score: this.score(q, [tr.name, tr.role, tr.bio]),
      });
    }

    for (const c of clients) {
      results.push({
        type: 'client',
        id: c.id,
        slug: c.name.toLowerCase().replace(/\s+/g, '-'),
        title: c.name,
        url: `/portfolio?client=${c.id}`,
        locale,
        score: this.score(q, [c.name]),
      });
    }

    for (const t of testimonials) {
      const tr = t.translations[0];
      if (!tr) continue;
      results.push({
        type: 'testimonial',
        id: t.id,
        slug: t.key,
        title: tr.author,
        excerpt: `« ${tr.quote.slice(0, 120)}… » — ${tr.company}`,
        url: `/#testimonials`,
        locale,
        score: this.score(q, [tr.author, tr.quote, tr.company]),
      });
    }

    for (const n of navItems) {
      const tr = n.translations[0];
      if (!tr) continue;
      results.push({
        type: 'nav',
        id: n.id,
        slug: n.key,
        title: tr.label,
        url: n.href,
        locale,
        score: this.score(q, [tr.label]),
      });
    }

    // ============================================================
    // Tri par score descendant puis slice
    // ============================================================
    results.sort((a, b) => b.score - a.score);
    const top = results.slice(0, limit);

    // ============================================================
    // Regroupement par type
    // ============================================================
    const byType: Partial<Record<SearchResultType, number>> = {};
    for (const r of top) {
      byType[r.type] = (byType[r.type] ?? 0) + 1;
    }

    this.logger.log(
      `Recherche "${q}" [${locale}] : ${top.length} résultat(s)`,
    );

    return {
      query: q,
      locale,
      total: top.length,
      results: top,
      byType,
      generatedAt: new Date().toISOString(),
    };
  }

  // ============================================================
  // SCORE DE PERTINENCE
  // ============================================================
  /**
   * Calcule un score de pertinence simple (0-100) :
   *  - match exact (case-insensitive)          → 100
   *  - commence par le terme                   → 90
   *  - contient le terme dans le titre         → 70
   *  - contient le terme ailleurs              → 50
   *  - aucune correspondance                   → 0
   */
  private score(query: string, fields: string[]): number {
    const q = query.toLowerCase();
    let best = 0;

    for (let i = 0; i < fields.length; i++) {
      const f = fields[i]?.toLowerCase() ?? '';
      if (!f) continue;

      const isFirstField = i === 0;

      if (f === q) {
        best = Math.max(best, 100);
      } else if (f.startsWith(q)) {
        best = Math.max(best, isFirstField ? 90 : 75);
      } else if (f.includes(q)) {
        best = Math.max(best, isFirstField ? 70 : 50);
      }
    }

    return best;
  }
}