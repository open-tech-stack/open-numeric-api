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

import { ServiceTranslationDto } from './service-translation.dto.js';
import { CreateServiceCategoryDto } from './create-service-category.dto.js';

export class CreateServiceDto {
  @ApiProperty({ example: 'development' })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'La clé ne peut contenir que des minuscules, chiffres et tirets.',
  })
  key!: string;

  @ApiProperty({ example: 'developpement' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Le slug ne peut contenir que des minuscules, chiffres et tirets.',
  })
  slug!: string;

  @ApiProperty({ example: '/services/developpement' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  href!: string;

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

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: [ServiceTranslationDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ServiceTranslationDto)
  translations!: ServiceTranslationDto[];

  @ApiPropertyOptional({ type: [CreateServiceCategoryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateServiceCategoryDto)
  categories?: CreateServiceCategoryDto[];
}