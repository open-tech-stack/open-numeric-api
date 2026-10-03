import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { ServiceCategoryTranslationDto } from './service-category-translation.dto.js';
import { CreateServiceItemDto } from './create-service-item.dto.js';

export class CreateServiceCategoryDto {
  @ApiProperty({ example: 'frontend' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'La clé ne peut contenir que des minuscules, chiffres et tirets.',
  })
  key!: string;

  @ApiProperty({ example: 'Code2' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  icon!: string;

  @ApiProperty({ example: 'from-blue-500 to-cyan-500' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  accent!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({ type: [ServiceCategoryTranslationDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ServiceCategoryTranslationDto)
  translations!: ServiceCategoryTranslationDto[];

  @ApiPropertyOptional({ type: [CreateServiceItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateServiceItemDto)
  items?: CreateServiceItemDto[];
}