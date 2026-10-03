import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class RefreshDto {
  @ApiPropertyOptional({
    description:
      'Refresh token JWT (mobile uniquement — le web utilise un cookie httpOnly).',
  })
  @IsOptional()
  @IsString()
  @MinLength(20)
  refreshToken?: string;
}