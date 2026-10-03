import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateTestimonialDto } from './create-testimonial.dto.js';

/**
 * Update : on ne permet PAS de changer la `key`.
 * Les `translations` sont remplacées entièrement si fournies.
 */
export class UpdateTestimonialDto extends PartialType(
  OmitType(CreateTestimonialDto, ['key'] as const),
) {}