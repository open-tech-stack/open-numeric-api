// src/prisma/prisma.service.ts
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../generated/prisma/client.js';

/**
 * Service Prisma.
 *
 * - Utilise un driver adapter `PrismaPg` (obligatoire en Prisma 7).
 * - Gère la connexion / déconnexion via le cycle de vie Nest.
 * - Retry automatique de la connexion initiale (utile pour
 *   Prisma Cloud qui peut avoir un cold start au premier appel).
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  /** Nombre max de tentatives de connexion au démarrage */
  private static readonly MAX_RETRIES = 3;
  /** Délai entre deux tentatives (ms) */
  private static readonly RETRY_DELAY_MS = 1500;

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });

    super({
      adapter,
      log: [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    await this.connectWithRetry();

    // Branchement des logs Prisma sur notre Logger Nest
    // @ts-expect-error — signature interne Prisma $on
    this.$on('error', (e: { message: string }) => {
      this.logger.error(`Prisma error: ${e.message}`);
    });
    // @ts-expect-error — signature interne Prisma $on
    this.$on('warn', (e: { message: string }) => {
      this.logger.warn(`Prisma warn: ${e.message}`);
    });
  }

  async onModuleDestroy() {
    this.logger.log('Déconnexion de la base…');
    await this.$disconnect();
  }

  /**
   * Connexion avec retry — utile si la base met du temps à répondre
   * (cas typique : Prisma Cloud au tout premier appel).
   */
  private async connectWithRetry(): Promise<void> {
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= PrismaService.MAX_RETRIES; attempt++) {
      try {
        await this.$connect();
        this.logger.log(
          `✅ Base de données connectée (tentative ${attempt}/${PrismaService.MAX_RETRIES})`,
        );
        return;
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `⚠️  Connexion DB échouée (tentative ${attempt}/${PrismaService.MAX_RETRIES}) : ${msg}`,
        );

        if (attempt < PrismaService.MAX_RETRIES) {
          await new Promise((r) =>
            setTimeout(r, PrismaService.RETRY_DELAY_MS),
          );
        }
      }
    }

    const finalMsg =
      lastError instanceof Error ? lastError.message : String(lastError);
    this.logger.error(`❌ Connexion DB définitivement échouée : ${finalMsg}`);
    // On ne throw PAS : on laisse l'app démarrer et l'erreur remontera
    // au moment d'une vraie requête (health renverra connected: false).
  }
}