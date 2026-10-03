import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'nestor' })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username!: string;

  @ApiProperty({ example: 'S3cur3P@ssw0rd!' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;
}