import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateTeamMemberDto } from './create-team-member.dto.js';

/**
 * Update : on ne permet PAS de changer la `key` (identifiant stable).
 * Les `translations` sont remplacées entièrement si fournies.
 */
export class UpdateTeamMemberDto extends PartialType(
  OmitType(CreateTeamMemberDto, ['key'] as const),
) {}