import { Module } from '@nestjs/common';

import { ClientsController } from './clients.controller.js';
import { ClientsService } from './clients.service.js';
import { ClientsRepository } from './repositories/clients.repository.js';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService, ClientsRepository],
  exports: [ClientsService],
})
export class ClientsModule {}