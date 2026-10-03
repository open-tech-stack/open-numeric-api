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

import { SocialsService } from './socials.service.js';
import {
  CreateSocialDto,
  UpdateSocialDto,
} from './dto/index.js';

@ApiTags('Socials')
@Controller('socials')
export class SocialsController {
  constructor(private readonly service: SocialsService) {}

  // ================================================================
  // PUBLIC
  // ================================================================
  @Public()
  @Get()
  @ApiOperation({ summary: 'Liste publique des réseaux sociaux actifs' })
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
  @ApiOperation({ summary: 'Détail admin d’un réseau social' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer un réseau social' })
  create(
    @Body() dto: CreateSocialDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.create(dto, user.sub);
  }

  @Patch(':id')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Modifier un réseau social (translations remplacées si fournies)',
  })
  update(@Param('id') id: string, @Body() dto: UpdateSocialDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer un réseau social' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}