import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

import {
  SUPPORTED_LOCALES,
  type Locale,
} from '../../../common/types/locale.type.js';

export class NavTranslationDto {
  @ApiProperty({ enum: SUPPORTED_LOCALES })
  @IsEnum(SUPPORTED_LOCALES)
  locale!: Locale;

  @ApiProperty({ example: 'Accueil' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  label!: string;
}