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

import { ServicesService } from './services.service.js';
import {
  CreateServiceCategoryDto,
  CreateServiceDto,
  CreateServiceItemDto,
  UpdateServiceCategoryDto,
  UpdateServiceDto,
  UpdateServiceItemDto,
} from './dto/index.js';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly service: ServicesService) {}

  // ================================================================
  // PUBLIC
  // ================================================================
  @Public()
  @Get()
  @ApiOperation({ summary: 'Liste publique des services (avec catégories + items)' })
  findAllPublic() {
    return this.service.findAllPublic();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Détail public d’un service par slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlugPublic(slug);
  }

  // ================================================================
  // ADMIN — Services
  // ================================================================
  @Get('admin/all')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Liste admin (tous, même inactifs)' })
  findAllAdmin() {
    return this.service.findAllAdmin();
  }

  @Get('admin/:id')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Détail admin d’un service' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer un service (avec catégories + items)' })
  create(
    @Body() dto: CreateServiceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.createService(dto, user.sub);
  }

  @Patch(':id')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Modifier un service' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.service.updateService(id, dto);
  }

  @Delete(':id')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer un service' })
  remove(@Param('id') id: string) {
    return this.service.removeService(id);
  }

  // ================================================================
  // ADMIN — Catégories
  // ================================================================
  @Post(':serviceId/categories')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer une catégorie dans un service' })
  createCategory(
    @Param('serviceId') serviceId: string,
    @Body() dto: CreateServiceCategoryDto,
  ) {
    return this.service.createCategory(serviceId, dto);
  }

  @Patch('categories/:id')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Modifier une catégorie' })
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateServiceCategoryDto,
  ) {
    return this.service.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer une catégorie' })
  removeCategory(@Param('id') id: string) {
    return this.service.removeCategory(id);
  }

  // ================================================================
  // ADMIN — Items
  // ================================================================
  @Post('categories/:categoryId/items')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer un item dans une catégorie' })
  createItem(
    @Param('categoryId') categoryId: string,
    @Body() dto: CreateServiceItemDto,
  ) {
    return this.service.createItem(categoryId, dto);
  }

  @Patch('items/:id')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Modifier un item' })
  updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateServiceItemDto,
  ) {
    return this.service.updateItem(id, dto);
  }

  @Delete('items/:id')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer un item' })
  removeItem(@Param('id') id: string) {
    return this.service.removeItem(id);
  }
}