import { Module } from '@nestjs/common';

import { ContactController } from './contact.controller.js';
import { ContactService } from './contact.service.js';
import { ContactRepository } from './repositories/contact.repository.js';

@Module({
  controllers: [ContactController],
  providers: [ContactService, ContactRepository],
  exports: [ContactService],
})
export class ContactModule {}