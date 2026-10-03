import { Module } from '@nestjs/common';

import { QuoteController } from './quote.controller.js';
import { QuoteService } from './quote.service.js';
import { QuoteRepository } from './repositories/quote.repository.js';

@Module({
  controllers: [QuoteController],
  providers: [QuoteService, QuoteRepository],
  exports: [QuoteService],
})
export class QuoteModule {}