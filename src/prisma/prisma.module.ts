// src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service.js';

/**
 * Module global Prisma.
 *
 * Grâce à `@Global()`, `PrismaService` est injectable partout dans l'app
 * sans avoir à importer `PrismaModule` dans chaque module métier.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}