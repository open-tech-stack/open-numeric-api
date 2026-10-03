import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { SUPPORTED_LOCALES, type Locale } from '../../../common/types/locale.type.js';

export class GalleryCaptionDto {
  @ApiProperty({ enum: SUPPORTED_LOCALES })
  @IsEnum(SUPPORTED_LOCALES)
  locale!: Locale;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  caption!: string;
}

export class ProjectGalleryDto {
  @ApiProperty({ example: '/projects/ecommerce-1.jpg' })
  @IsString()
  @MinLength(1)
  src!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({ type: [GalleryCaptionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GalleryCaptionDto)
  translations!: GalleryCaptionDto[];
}