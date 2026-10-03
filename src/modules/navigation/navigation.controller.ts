import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AdminRole } from '../../generated/prisma/client.js';
import type { JwtPayload } from '../auth/types/jwt-payload.type.js';

import { NavigationService } from './navigation.service.js';
import {
  CreateNavItemDto,
  ReorderNavDto,
  UpdateNavItemDto,
} from './dto/index.js';

@ApiTags('Navigation')
@Controller('nav')
export class NavigationController {
  constructor(private readonly service: NavigationService) {}

  // ----------------------------------------------------------------
  // PUBLIC — arbre des menus pour le site
  // ----------------------------------------------------------------
  @Public()
  @Get()
  @ApiOperation({ summary: 'Arbre de navigation public (actifs seulement)' })
  getPublic() {
    return this.service.getPublicTree();
  }

  // ----------------------------------------------------------------
  // ADMIN — liste à plat (tous, même inactifs)
  // ----------------------------------------------------------------
  @Get('admin/all')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Liste à plat (ADMIN + EDITOR)' })
  findAllFlat() {
    return this.service.findAllFlat();
  }

  @Get('admin/:id')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Détail d’un NavItem' })
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  // ----------------------------------------------------------------
  // CREATE
  // ----------------------------------------------------------------
  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer un NavItem' })
  create(
    @Body() dto: CreateNavItemDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.create(dto, user.sub);
  }

  // ----------------------------------------------------------------
  // UPDATE
  // ----------------------------------------------------------------
  @Patch('reorder')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Réordonner + re-parenter plusieurs items en une requête',
  })
  reorder(@Body() dto: ReorderNavDto) {
    return this.service.reorder(dto);
  }

  @Patch(':id')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Modifier un NavItem' })
  update(@Param('id') id: string, @Body() dto: UpdateNavItemDto) {
    return this.service.update(id, dto);
  }

  // ----------------------------------------------------------------
  // DELETE
  // ----------------------------------------------------------------
  @Delete(':id')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Supprimer un NavItem (les enfants sont supprimés en cascade)',
  })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}