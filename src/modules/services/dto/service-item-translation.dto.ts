import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { SUPPORTED_LOCALES, type Locale } from '../../../common/types/locale.type.js';

export class ServiceItemTranslationDto {
  @ApiProperty({ enum: SUPPORTED_LOCALES })
  @IsEnum(SUPPORTED_LOCALES)
  locale!: Locale;

  @ApiProperty({ example: 'React / Next.js' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}