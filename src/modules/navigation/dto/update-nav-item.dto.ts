import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateNavItemDto } from './create-nav-item.dto.js';

/**
 * Update : on ne permet PAS de changer la `key` (identifiant stable).
 * Les `translations` sont optionnelles et remplacées entièrement.
 */
export class UpdateNavItemDto extends PartialType(
  OmitType(CreateNavItemDto, ['key'] as const),
) {}