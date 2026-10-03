import { Module } from '@nestjs/common';

import { ServicesController } from './services.controller.js';
import { ServicesService } from './services.service.js';
import { ServicesRepository } from './repositories/services.repository.js';

@Module({
  controllers: [ServicesController],
  providers: [ServicesService, ServicesRepository],
  exports: [ServicesService],
})
export class ServicesModule {}