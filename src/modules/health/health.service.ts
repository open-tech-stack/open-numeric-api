import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  uptime: number;
  timestamp: string;
  version: string;
  checks: {
    database: {
      status: 'up' | 'down';
      responseTime: number;
      error?: string;
    };
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthResponse> {
    const start = Date.now();

    let dbStatus: 'up' | 'down' = 'down';
    let dbError: string | undefined;
    let responseTime = 0;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'up';
      responseTime = Date.now() - start;
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
      this.logger.error(`Health check DB failed: ${dbError}`);
    }

    const overall: HealthResponse['status'] =
      dbStatus === 'up' ? 'ok' : 'down';

    return {
      status: overall,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.0.1',
      checks: {
        database: {
          status: dbStatus,
          responseTime,
          ...(dbError && { error: dbError }),
        },
      },
    };
  }
}