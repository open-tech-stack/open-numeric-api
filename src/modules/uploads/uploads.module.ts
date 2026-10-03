import { Module } from '@nestjs/common';

import { UploadsController } from './uploads.controller.js';
import { UploadsService } from './uploads.service.js';
import { UploadsRepository } from './repositories/uploads.repository.js';

@Module({
  controllers: [UploadsController],
  providers: [UploadsService, UploadsRepository],
  exports: [UploadsService],
})
export class UploadsModule {}