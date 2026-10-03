import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { NavTranslationDto } from './nav-translation.dto.js';

export class CreateNavItemDto {
  @ApiProperty({ example: 'services' })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'La clé ne peut contenir que des minuscules, chiffres et tirets.',
  })
  key!: string;

  @ApiProperty({ example: '/services' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  href!: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: null, description: 'ID du parent (pour un sous-menu)' })
  @IsOptional()
  @IsString()
  parentId?: string | null;

  @ApiProperty({ type: [NavTranslationDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => NavTranslationDto)
  translations!: NavTranslationDto[];
}