import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { TestimonialTranslationDto } from './testimonial-translation.dto.js';

export class CreateTestimonialDto {
  @ApiProperty({ example: 't1' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'La clé ne peut contenir que des minuscules, chiffres et tirets.',
  })
  key!: string;

  @ApiProperty({ example: '/images/test2.jpg' })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  image!: string;

  @ApiPropertyOptional({ default: 5, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: [TestimonialTranslationDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TestimonialTranslationDto)
  translations!: TestimonialTranslationDto[];
}