import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto.js';

/**
 * Update : on ne permet PAS de changer le `slug`.
 * Les `translations`, `gallery`, `features`, `links` sont remplacées entièrement si fournies.
 */
export class UpdateProjectDto extends PartialType(
  OmitType(CreateProjectDto, ['slug'] as const),
) {}