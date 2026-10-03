import { PartialType } from '@nestjs/swagger';
import { CreateClientDto } from './create-client.dto.js';

/**
 * Update : tous les champs sont optionnels.
 */
export class UpdateClientDto extends PartialType(CreateClientDto) {}