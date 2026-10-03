import { Module } from '@nestjs/common';

import { SocialsController } from './socials.controller.js';
import { SocialsService } from './socials.service.js';
import { SocialsRepository } from './repositories/socials.repository.js';

@Module({
  controllers: [SocialsController],
  providers: [SocialsService, SocialsRepository],
  exports: [SocialsService],
})
export class SocialsModule {}