import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateServiceCategoryDto } from './create-service-category.dto.js';

export class UpdateServiceCategoryDto extends PartialType(
  OmitType(CreateServiceCategoryDto, ['key'] as const),
) {}