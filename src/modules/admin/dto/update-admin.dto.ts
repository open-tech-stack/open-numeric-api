import { PartialType } from '@nestjs/swagger';
import { CreateAdminDto } from './create-admin.dto.js';

export class UpdateAdminDto extends PartialType(CreateAdminDto) {}