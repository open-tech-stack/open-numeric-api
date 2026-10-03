import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import {
  SUPPORTED_LOCALES,
  type Locale,
} from '../../../common/types/locale.type.js';
import type { SearchResultType } from '../types/search-response.type.js';

const TYPES: SearchResultType[] = [
  'project',
  'service',
  'team',
  'client',
  'testimonial',
  'nav',
];

export class QuerySearchDto {
  @ApiProperty({
    example: 'ecommerce',
    description: 'Terme de recherche (min 2 caractères)',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  q!: string;

  @ApiPropertyOptional({
    enum: SUPPORTED_LOCALES,
    default: 'fr',
    description: 'Locale dans laquelle chercher',
  })
  @IsOptional()
  @IsEnum(SUPPORTED_LOCALES)
  locale?: Locale = 'fr';

  @ApiPropertyOptional({
    enum: TYPES,
    isArray: true,
    description: 'Restreindre la recherche à certains types',
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? value.split(',').map((s) => s.trim())
        : value,
  )
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(TYPES, { each: true })
  types?: SearchResultType[];

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}