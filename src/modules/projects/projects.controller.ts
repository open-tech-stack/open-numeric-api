import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AdminRole } from '../../generated/prisma/client.js';
import type { JwtPayload } from '../auth/types/jwt-payload.type.js';

import { ProjectsService } from './projects.service.js';
import {
  CreateProjectDto,
  QueryProjectsDto,
  UpdateProjectDto,
} from './dto/index.js';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  // ================================================================
  // PUBLIC
  // ================================================================
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Liste publique paginée (filtres : category, scope, year, tech, search)',
  })
  findAllPublic(@Query() query: QueryProjectsDto) {
    return this.service.findAllPublic(query);
  }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Détail public par slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlugPublic(slug);
  }

  @Public()
  @Get('slug/:slug/similar')
  @ApiOperation({ summary: 'Projets similaires par slug' })
  findSimilar(@Param('slug') slug: string) {
    return this.service.findSimilarPublic(slug);
  }

  // ================================================================
  // ADMIN
  // ================================================================
  @Get('admin/all')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Liste admin paginée (même inactifs si includeInactive=true)' })
  findAllAdmin(@Query() query: QueryProjectsDto) {
    return this.service.findAllAdmin(query);
  }

  @Get('admin/:id')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Détail admin par id' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Créer un projet (avec translations + gallery + features + links)',
  })
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.create(dto, user.sub);
  }

  @Patch(':id')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Modifier un projet (translations/gallery/features/links remplacées si fournies)',
  })
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer un projet' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}