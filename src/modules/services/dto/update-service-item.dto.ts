import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateServiceItemDto } from './create-service-item.dto.js';

export class UpdateServiceItemDto extends PartialType(
  OmitType(CreateServiceItemDto, ['key'] as const),
) {}