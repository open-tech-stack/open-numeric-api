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
import { UploadsModule } from './modules/uploads/uploads.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { StatsModule } from './modules/stats/stats.module.js';
import { SearchModule } from './modules/search/search.module.js';

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
      useFactory: (config: ConfigService<AppConfig, true>) => [
        {
          ttl: 60_000,
          limit: config.get('rateLimit.max', { infer: true }),
        },
      ],
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
    UploadsModule,
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
export class AppModule { }