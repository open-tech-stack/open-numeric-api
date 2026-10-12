import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  currentPassword!: string;

  @ApiProperty({ example: 'N3wS3cur3P@ss!' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  newPassword!: string;
}