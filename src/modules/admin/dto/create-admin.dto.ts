import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { AdminRole } from '../../../generated/prisma/client.js';

export class CreateAdminDto {
  @ApiProperty({ example: 'nestor' })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9_.-]+$/, {
    message:
      'Le username ne peut contenir que des minuscules, chiffres, points, tirets et underscores.',
  })
  username!: string;

  @ApiProperty({ example: 'S3cur3P@ssw0rd!' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;

  @ApiProperty({ example: 'Nestor COMPAORE' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName!: string;

  @ApiProperty({ example: 'nestor@open-numeric.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ enum: AdminRole, default: AdminRole.EDITOR })
  @IsEnum(AdminRole)
  role!: AdminRole;
}