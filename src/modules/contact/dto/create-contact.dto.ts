import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: 'Jean Dupont' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: 'jean@exemple.com' })
  @IsEmail()
  @MaxLength(200)
  email!: string;

  @ApiProperty({ example: 'Demande d’information' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  subject!: string;

  @ApiProperty({ example: 'Bonjour, je souhaite...' })
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message!: string;
}