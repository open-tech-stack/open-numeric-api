import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { ServiceItemTranslationDto } from './service-item-translation.dto.js';

export class CreateServiceItemDto {
  @ApiProperty({ example: 'react' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'La clé ne peut contenir que des minuscules, chiffres et tirets.',
  })
  key!: string;

  @ApiPropertyOptional({ example: '/images/dev/react.png' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: 'Code2' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiProperty({ type: [ServiceItemTranslationDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ServiceItemTranslationDto)
  translations!: ServiceItemTranslationDto[];
}