import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { JwtAuthGuard, RolesGuard } from './common/guards/index.js';
import configuration, { AppConfig } from './config/configuration.js';
import { validateEnv } from './config/env.validation.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SettingsModule } from './modules/settings/settings.module.js';
import { NavigationModule } from './modules/navigation/navigation.module.js';
import { ServicesModule } from './modules/services/services.module.js';
import { ProjectsModule } from './modules/projects/projects.module.js';
import { TeamModule } from './modules/team/team.module.js';
import { ClientsModule } from './modules/clients/clients.module.js';
import { TestimonialsModule } from './modules/testimonials/testimonials.module.js';
import { SocialsModule } from './modules/socials/socials.module.js';
import { ContactModule } from './modules/contact/contact.module.js';
import { QuoteModule } from './modules/quote/quote.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { StatsModule } from './modules/stats/stats.module.js';
import { SearchModule } from './modules/search/search.module.js';

/**
 * Convertit une durée exprimée sous la forme :
 * - 15m : 15 minutes
 * - 1h  : 1 heure
 * - 30s : 30 secondes
 * - 1000 : 1000 millisecondes
 */
function parseDurationToMilliseconds(value: string): number {
  const normalized = value.trim();

  const match = /^(\d+(?:\.\d+)?)(ms|s|m|h|d)?$/i.exec(normalized);

  if (!match) {
    throw new Error(
      `RATE_LIMIT_WINDOW invalide : "${value}". ` +
        'Utilise une durée comme 15m, 1h, 30s ou 1000ms.',
    );
  }

  const amount = Number(match[1]);
  const unit = (match[2] ?? 'ms').toLowerCase();

  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  const milliseconds = amount * multipliers[unit];

  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    throw new Error(
      `RATE_LIMIT_WINDOW doit être une durée positive : "${value}".`,
    );
  }

  return milliseconds;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env'],
      load: [configuration],
      validate: validateEnv,
    }),

    // Rate limiting global
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const window = config.get('rateLimit.window', {
          infer: true,
        });

        const limit = config.get('rateLimit.max', {
          infer: true,
        });

        return [
          {
            ttl: parseDurationToMilliseconds(window),
            limit,
          },
        ];
      },
    }),

    PrismaModule,
    AuthModule,
    AdminModule,
    SettingsModule,
    NavigationModule,
    ServicesModule,
    ProjectsModule,
    TeamModule,
    ClientsModule,
    TestimonialsModule,
    SocialsModule,
    ContactModule,
    QuoteModule,
    StatsModule,
    SearchModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
