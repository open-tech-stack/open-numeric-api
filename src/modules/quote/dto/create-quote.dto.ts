import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateQuoteDto {
  @ApiProperty({ example: 'Jean Dupont' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({ example: 'Ma société SARL' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  company?: string;

  @ApiProperty({ example: 'jean@exemple.com' })
  @IsEmail()
  @MaxLength(200)
  email!: string;

  @ApiPropertyOptional({ example: '+226 65 00 00 00' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiProperty({ example: 'webApp' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  projectType!: string;

  @ApiProperty({ example: '2k5k' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  budget!: string;

  @ApiProperty({ example: '1m3m' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  timeline!: string;

  @ApiProperty({ example: 'Nous souhaitons une application de gestion pour...' })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description!: string;
}