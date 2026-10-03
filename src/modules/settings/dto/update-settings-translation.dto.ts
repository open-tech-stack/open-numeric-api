import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { SUPPORTED_LOCALES, type Locale } from '../../../common/types/locale.type.js';

export class UpdateSettingsTranslationDto {
  @ApiProperty({ enum: SUPPORTED_LOCALES })
  @IsEnum(SUPPORTED_LOCALES)
  locale!: Locale;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  tagline?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  about?: string;
}