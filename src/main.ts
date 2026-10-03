import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { ValidationPipe } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module.js';
import type { AppConfig } from './config/configuration.js';

/**
 * Résout le chemin des assets Swagger UI.
 *
 * - En PROD (`dist/swagger-ui` existe)  : on sert les assets copiés par
 *   le script `copy-swagger-assets.mjs` (déployés avec le build).
 * - En DEV (pas de `dist/swagger-ui`)   : on sert directement depuis
 *   `node_modules/swagger-ui-dist` — pas besoin de build.
 */
function resolveSwaggerUiPath(): string | undefined {
  const prodPath = join(process.cwd(), 'dist', 'swagger-ui');
  if (existsSync(prodPath)) return prodPath;

  const devPath = join(process.cwd(), 'node_modules', 'swagger-ui-dist');
  if (existsSync(devPath)) return devPath;

  // Rien trouvé : on laisse Nest utiliser son CDN par défaut
  return undefined;
}

function buildCorsOrigin(isProd: boolean, origins: string[]): CorsOptions['origin'] {
  return (origin, callback) => {
    if (!origin) return callback(null, true);
    if (!isProd) return callback(null, true);

    const isConfigured = origins.includes(origin.replace(/\/$/, ''));
    const isPreview = /^https:\/\/open-numeric-[a-z0-9-]+\.vercel\.app$/.test(
      origin,
    );

    return callback(null, isConfigured || isPreview);
  };
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService<AppConfig, true>);

  const isProd = config.get('app.env', { infer: true }) === 'production';

  // Préfixe global de l'API
  app.setGlobalPrefix('api');

  // Cookie parser (pour les tokens httpOnly)
  app.use(cookieParser());

  // Fichiers statiques — uploads utilisateurs
  // ⚠️ Servis HORS du préfixe /api → accessible via /uploads/xxx.png
  app.useStaticAssets(join(process.cwd(), 'public', 'uploads'), {
    prefix: '/uploads/',
    maxAge: isProd ? '30d' : 0,
    etag: true,
    index: false,
  });

  // CORS
  app.enableCors({
    origin: buildCorsOrigin(isProd, config.get('cors.origins', { infer: true })),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Client',
    ],
    maxAge: 86400,
  });

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger
  if (config.get('app.swaggerEnabled', { infer: true })) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Open Numeric API')
      .setDescription(
        'API backend du site Open Numeric — gestion dynamique des projets, services, équipe, témoignages, contacts et devis.',
      )
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description:
            'Token JWT (access token). Le dashboard utilise un cookie httpOnly.',
          in: 'header',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    const swaggerUiPath = resolveSwaggerUiPath();

    SwaggerModule.setup('docs', app, document, {
      useGlobalPrefix: false,
      jsonDocumentUrl: 'docs-json',
      ...(swaggerUiPath && { customSwaggerUiPath: swaggerUiPath }),
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'Open Numeric API — Documentation',
    });
  }

  const port = config.get('app.port', { infer: true });
  await app.listen(port);

  console.log(`🚀 API prête sur http://localhost:${port}/api`);
  console.log(`🖼️  Uploads sur http://localhost:${port}/uploads/...`);
  if (config.get('app.swaggerEnabled', { infer: true })) {
    console.log(`📘 Swagger sur http://localhost:${port}/docs`);
  }
}

bootstrap();