import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateSocialDto } from './create-social.dto.js';

/**
 * Update : on ne permet PAS de changer la `key`.
 * Les `translations` sont remplacées entièrement si fournies.
 */
export class UpdateSocialDto extends PartialType(
  OmitType(CreateSocialDto, ['key'] as const),
) {}