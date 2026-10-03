import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  RecentContact,
  RecentQuote,
  StatsResponse,
} from './types/stats-response.type.js';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<StatsResponse> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // ============================================================
    // CONTENU — compteurs parallèles
    // ============================================================
    const [
      projectsTotal,
      projectsActive,
      projectsFeatured,
      projectsCompleted,
      projectsInProgress,
      servicesTotal,
      servicesActive,
      teamTotal,
      teamActive,
      clientsTotal,
      clientsActive,
      testimonialsTotal,
      testimonialsActive,
      socialsTotal,
      socialsActive,
      navTotal,
      navActive,
      uploadsAggregate,
      uploadsTotal,
    ] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.project.count({ where: { isActive: true } }),
      this.prisma.project.count({ where: { featured: true } }),
      this.prisma.project.count({ where: { status: 'COMPLETED' } }),
      this.prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.service.count(),
      this.prisma.service.count({ where: { isActive: true } }),
      this.prisma.teamMember.count(),
      this.prisma.teamMember.count({ where: { isActive: true } }),
      this.prisma.client.count(),
      this.prisma.client.count({ where: { isActive: true } }),
      this.prisma.testimonial.count(),
      this.prisma.testimonial.count({ where: { isActive: true } }),
      this.prisma.social.count(),
      this.prisma.social.count({ where: { isActive: true } }),
      this.prisma.navItem.count(),
      this.prisma.navItem.count({ where: { isActive: true } }),
      this.prisma.upload.aggregate({ _sum: { size: true } }),
      this.prisma.upload.count(),
    ]);

    // ============================================================
    // CONTENU — répartition par catégorie et scope
    // ============================================================
    const [byCategoryRaw, byScopeRaw] = await Promise.all([
      this.prisma.project.groupBy({
        by: ['category'],
        _count: { _all: true },
      }),
      this.prisma.project.groupBy({
        by: ['scope'],
        _count: { _all: true },
      }),
    ]);

    const byCategory: Record<string, number> = {};
    for (const row of byCategoryRaw) {
      byCategory[row.category] = row._count._all;
    }

    const byScope: Record<string, number> = {};
    for (const row of byScopeRaw) {
      byScope[row.scope] = row._count._all;
    }

    // ============================================================
    // INTERACTIONS — contacts
    // ============================================================
    const [
      contactsTotal,
      contactsNew,
      contactsRead,
      contactsReplied,
      contactsArchived,
      contactsSpam,
      contactsLast7Days,
    ] = await Promise.all([
      this.prisma.contactSubmission.count(),
      this.prisma.contactSubmission.count({ where: { status: 'NEW' } }),
      this.prisma.contactSubmission.count({ where: { status: 'READ' } }),
      this.prisma.contactSubmission.count({ where: { status: 'REPLIED' } }),
      this.prisma.contactSubmission.count({ where: { status: 'ARCHIVED' } }),
      this.prisma.contactSubmission.count({ where: { status: 'SPAM' } }),
      this.prisma.contactSubmission.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
    ]);

    // ============================================================
    // INTERACTIONS — quotes
    // ============================================================
    const [
      quotesTotal,
      quotesNew,
      quotesRead,
      quotesReplied,
      quotesArchived,
      quotesSpam,
      quotesLast7Days,
    ] = await Promise.all([
      this.prisma.quoteRequest.count(),
      this.prisma.quoteRequest.count({ where: { status: 'NEW' } }),
      this.prisma.quoteRequest.count({ where: { status: 'READ' } }),
      this.prisma.quoteRequest.count({ where: { status: 'REPLIED' } }),
      this.prisma.quoteRequest.count({ where: { status: 'ARCHIVED' } }),
      this.prisma.quoteRequest.count({ where: { status: 'SPAM' } }),
      this.prisma.quoteRequest.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
    ]);

    // ============================================================
    // ACTIVITÉ RÉCENTE
    // ============================================================
    const [lastContacts, lastQuotes] = await Promise.all([
      this.prisma.contactSubmission.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          subject: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.quoteRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          projectType: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      content: {
        projects: {
          total: projectsTotal,
          active: projectsActive,
          featured: projectsFeatured,
          published: projectsCompleted,
          inProgress: projectsInProgress,
          byCategory,
          byScope,
        },
        services: { total: servicesTotal, active: servicesActive },
        team: { total: teamTotal, active: teamActive },
        clients: { total: clientsTotal, active: clientsActive },
        testimonials: {
          total: testimonialsTotal,
          active: testimonialsActive,
        },
        socials: { total: socialsTotal, active: socialsActive },
        navigation: { total: navTotal, active: navActive },
        uploads: {
          total: uploadsTotal,
          totalSize: uploadsAggregate._sum.size ?? 0,
        },
      },
      interactions: {
        contacts: {
          total: contactsTotal,
          new: contactsNew,
          read: contactsRead,
          replied: contactsReplied,
          archived: contactsArchived,
          spam: contactsSpam,
          last7Days: contactsLast7Days,
        },
        quotes: {
          total: quotesTotal,
          new: quotesNew,
          read: quotesRead,
          replied: quotesReplied,
          archived: quotesArchived,
          spam: quotesSpam,
          last7Days: quotesLast7Days,
        },
      },
      activity: {
        lastContacts: lastContacts.map(
          (c): RecentContact => ({
            id: c.id,
            name: c.name,
            email: c.email,
            subject: c.subject,
            status: c.status,
            createdAt: c.createdAt.toISOString(),
          }),
        ),
        lastQuotes: lastQuotes.map(
          (q): RecentQuote => ({
            id: q.id,
            name: q.name,
            email: q.email,
            projectType: q.projectType,
            status: q.status,
            createdAt: q.createdAt.toISOString(),
          }),
        ),
      },
      generatedAt: new Date().toISOString(),
    };
  }
}