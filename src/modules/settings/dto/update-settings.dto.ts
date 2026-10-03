import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ example: 'Open Numeric' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  siteName?: string;

  @ApiPropertyOptional({ example: '/uploads/logo.png' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ example: '/uploads/favicon.ico' })
  @IsOptional()
  @IsString()
  favicon?: string;

  @ApiPropertyOptional({ example: 'contact@open-numeric.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emailSecondary?: string;

  @ApiPropertyOptional({ example: '+226 65 03 37 42' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneSecondary?: string;

  @ApiPropertyOptional({ example: '+22665033742' })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  whatsappSecondary?: string;

  @ApiPropertyOptional({
    example: 'SOMGANDE, Ouagadougou, Burkina Faso',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  mapEmbedUrl?: string;

  @ApiPropertyOptional({ example: '24/7' })
  @IsOptional()
  @IsString()
  availability?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultMetaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultMetaDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  googleAnalyticsId?: string;
}