import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

import { SUPPORTED_LOCALES, type Locale } from '../../../common/types/locale.type.js';

export class TestimonialTranslationDto {
  @ApiProperty({ enum: SUPPORTED_LOCALES })
  @IsEnum(SUPPORTED_LOCALES)
  locale!: Locale;

  @ApiProperty({
    example:
      'Open Numeric a transformé notre présence en ligne avec une application sur mesure.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(800)
  quote!: string;

  @ApiProperty({ example: 'Jean Lambert' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  author!: string;

  @ApiProperty({ example: 'CEO, TechCorp' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  company!: string;
}