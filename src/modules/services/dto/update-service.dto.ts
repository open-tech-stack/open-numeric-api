import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateServiceDto } from './create-service.dto.js';

/**
 * Update : on ne permet PAS de changer la `key` (identifiant stable).
 * Les `translations` et `categories` sont remplacées entièrement si fournies.
 */
export class UpdateServiceDto extends PartialType(
  OmitType(CreateServiceDto, ['key'] as const),
) {}