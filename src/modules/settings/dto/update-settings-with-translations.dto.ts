import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';

import { UpdateSettingsDto } from './update-settings.dto.js';
import { UpdateSettingsTranslationDto } from './update-settings-translation.dto.js';

export class UpdateSettingsWithTranslationsDto extends UpdateSettingsDto {
  @ApiPropertyOptional({ type: [UpdateSettingsTranslationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSettingsTranslationDto)
  translations?: UpdateSettingsTranslationDto[];
}