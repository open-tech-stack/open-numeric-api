import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

import { SUPPORTED_LOCALES, type Locale } from '../../../common/types/locale.type.js';

export class TeamTranslationDto {
  @ApiProperty({ enum: SUPPORTED_LOCALES })
  @IsEnum(SUPPORTED_LOCALES)
  locale!: Locale;

  @ApiProperty({ example: 'Nestor COMPAORE' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: 'CEO & Développeur Principal' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  role!: string;

  @ApiProperty({ example: 'Expert en développement full-stack...' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  bio!: string;
}