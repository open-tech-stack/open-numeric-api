import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import {
  ProjectCategory,
  ProjectScope,
  ProjectStatus,
} from '../../../generated/prisma/client.js';

import { ProjectTranslationDto } from './project-translation.dto.js';
import { ProjectGalleryDto } from './project-gallery.dto.js';
import { ProjectFeatureDto } from './project-feature.dto.js';
import { ProjectLinkDto } from './project-link.dto.js';

export class CreateProjectDto {
  @ApiProperty({ example: 'ecommerce-multi-vendeurs' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Le slug ne peut contenir que des minuscules, chiffres et tirets.',
  })
  slug!: string;

  @ApiProperty({ example: '/projects/ecommerce.jpg' })
  @IsString()
  @MinLength(1)
  cover!: string;

  @ApiPropertyOptional({ example: '/projects/ecommerce-hero.jpg' })
  @IsOptional()
  @IsString()
  heroImage?: string;

  @ApiProperty({ enum: ProjectCategory })
  @IsEnum(ProjectCategory)
  category!: ProjectCategory;

  @ApiProperty({ enum: ProjectScope })
  @IsEnum(ProjectScope)
  scope!: ProjectScope;

  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.COMPLETED })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiProperty({ example: 2025 })
  @IsInt()
  @Min(2000)
  year!: number;

  @ApiProperty({ example: ['Next.js', 'NestJS', 'PostgreSQL'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  tech!: string[];

  @ApiProperty({ example: ['E-commerce', 'Marketplace'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'ID du Client associé' })
  @IsOptional()
  @IsString()
  clientId?: string | null;

  @ApiProperty({ type: [ProjectTranslationDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProjectTranslationDto)
  translations!: ProjectTranslationDto[];

  @ApiPropertyOptional({ type: [ProjectGalleryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectGalleryDto)
  gallery?: ProjectGalleryDto[];

  @ApiPropertyOptional({ type: [ProjectFeatureDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectFeatureDto)
  features?: ProjectFeatureDto[];

  @ApiPropertyOptional({ type: [ProjectLinkDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectLinkDto)
  links?: ProjectLinkDto[];
}