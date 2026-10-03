import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { SocialTranslationDto } from './social-translation.dto.js';

export class CreateSocialDto {
  @ApiProperty({ example: 'facebook' })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'La clé ne peut contenir que des minuscules, chiffres et tirets.',
  })
  key!: string;

  @ApiProperty({ example: 'Facebook' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  icon!: string;

  @ApiProperty({ example: 'https://facebook.com/open-numeric' })
  @IsString()
  @IsUrl({ require_tld: false, require_protocol: true })
  url!: string;

  @ApiProperty({
    example: 'hover:text-blue-600',
    description: 'Classe Tailwind appliquée au hover de la pastille',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  hoverColor!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: [SocialTranslationDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SocialTranslationDto)
  translations!: SocialTranslationDto[];
}