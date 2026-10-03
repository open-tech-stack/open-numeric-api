import { Module } from '@nestjs/common';

import { TestimonialsController } from './testimonials.controller.js';
import { TestimonialsService } from './testimonials.service.js';
import { TestimonialsRepository } from './repositories/testimonials.repository.js';

@Module({
  controllers: [TestimonialsController],
  providers: [TestimonialsService, TestimonialsRepository],
  exports: [TestimonialsService],
})
export class TestimonialsModule {}