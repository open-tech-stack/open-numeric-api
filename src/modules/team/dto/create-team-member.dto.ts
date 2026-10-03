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

import { TeamTranslationDto } from './team-translation.dto.js';

export class CreateTeamMemberDto {
  @ApiProperty({ example: 'ceo' })
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'La clé ne peut contenir que des minuscules, chiffres et tirets.',
  })
  key!: string;

  @ApiProperty({ example: '/images/dev.jpg' })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  image!: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/nestor' })
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false, require_protocol: true })
  linkedin?: string;

  @ApiPropertyOptional({ example: 'https://twitter.com/nestor' })
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false, require_protocol: true })
  twitter?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: [TeamTranslationDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TeamTranslationDto)
  translations!: TeamTranslationDto[];
}