import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { SubmissionStatus } from '../../../generated/prisma/client.js';

export class UpdateContactStatusDto {
  @ApiProperty({ enum: SubmissionStatus })
  @IsEnum(SubmissionStatus)
  status!: SubmissionStatus;
}