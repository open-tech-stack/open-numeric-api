import { Module } from '@nestjs/common';

import { NavigationController } from './navigation.controller.js';
import { NavigationService } from './navigation.service.js';
import { NavRepository } from './repositories/nav.repository.js';

@Module({
  controllers: [NavigationController],
  providers: [NavigationService, NavRepository],
  exports: [NavigationService],
})
export class NavigationModule {}