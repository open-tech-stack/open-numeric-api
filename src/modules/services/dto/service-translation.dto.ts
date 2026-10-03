import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { SUPPORTED_LOCALES, type Locale } from '../../../common/types/locale.type.js';

export class ServiceTranslationDto {
  @ApiProperty({ enum: SUPPORTED_LOCALES })
  @IsEnum(SUPPORTED_LOCALES)
  locale!: Locale;

  @ApiProperty({ example: 'Développement' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  heroTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  heroTitleHighlight?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  heroSubtitle?: string;
}