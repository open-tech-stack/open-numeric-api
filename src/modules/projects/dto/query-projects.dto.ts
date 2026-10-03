import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import {
  ProjectCategory,
  ProjectScope,
  ProjectStatus,
} from '../../../generated/prisma/client.js';

export class QueryProjectsDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 9, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 9;

  @ApiPropertyOptional({
    description: 'Recherche full-text sur le titre et la description (français par défaut)',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ProjectCategory,
    isArray: true,
    description: 'Filtre par catégorie (multi)',
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : value,
  )
  @IsArray()
  @IsEnum(ProjectCategory, { each: true })
  category?: ProjectCategory[];

  @ApiPropertyOptional({
    enum: ProjectScope,
    isArray: true,
    description: 'Filtre par portée (multi)',
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : value,
  )
  @IsArray()
  @IsEnum(ProjectScope, { each: true })
  scope?: ProjectScope[];

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({
    isArray: true,
    description: 'Filtre par année (multi)',
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map(Number)
      : typeof value === 'string'
        ? value.split(',').map(Number)
        : value,
  )
  @IsArray()
  @IsInt({ each: true })
  year?: number[];

  @ApiPropertyOptional({
    isArray: true,
    description: 'Filtre par tech (multi)',
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : value,
  )
  @IsArray()
  @IsString({ each: true })
  tech?: string[];

  @ApiPropertyOptional({ description: 'Filtre sur les projets à la une' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Inclure les projets inactifs (admin)' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeInactive?: boolean;
}