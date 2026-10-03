import { Module } from '@nestjs/common';

import { TeamController } from './team.controller.js';
import { TeamService } from './team.service.js';
import { TeamRepository } from './repositories/team.repository.js';

@Module({
  controllers: [TeamController],
  providers: [TeamService, TeamRepository],
  exports: [TeamService],
})
export class TeamModule {}