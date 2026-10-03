import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AdminRole } from '../../generated/prisma/client.js';
import type { JwtPayload } from '../auth/types/jwt-payload.type.js';

import { ClientsService } from './clients.service.js';
import {
  CreateClientDto,
  UpdateClientDto,
} from './dto/index.js';

@ApiTags('Clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  // ================================================================
  // PUBLIC
  // ================================================================
  @Public()
  @Get()
  @ApiOperation({ summary: 'Liste publique des clients actifs' })
  findAllPublic() {
    return this.service.findAllPublic();
  }

  // ================================================================
  // ADMIN
  // ================================================================
  @Get('admin/all')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Liste admin (même inactifs)' })
  findAllAdmin() {
    return this.service.findAllAdmin();
  }

  @Get('admin/:id')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Détail admin d’un client' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer un client' })
  create(
    @Body() dto: CreateClientDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.create(dto, user.sub);
  }

  @Patch(':id')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Modifier un client' })
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer un client (bloqué si projets associés)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}