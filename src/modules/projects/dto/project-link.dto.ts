import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

import { ProjectLinkType } from '../../../generated/prisma/client.js';

export class ProjectLinkDto {
  @ApiProperty({ enum: ProjectLinkType })
  @IsEnum(ProjectLinkType)
  type!: ProjectLinkType;

  @ApiProperty({ example: 'https://demo.example.com' })
  @IsString()
  @IsUrl({ require_tld: false, require_protocol: false })
  url!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}