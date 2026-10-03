import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../common/decorators/roles.decorator.js';
import { AdminRole } from '../../generated/prisma/client.js';

import { StatsService } from './stats.service.js';

@ApiTags('Stats')
@ApiBearerAuth('access-token')
@Controller('stats')
export class StatsController {
  constructor(private readonly service: StatsService) {}

  @Get()
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiOperation({ summary: 'Statistiques globales du dashboard admin' })
  getStats() {
    return this.service.getStats();
  }
}