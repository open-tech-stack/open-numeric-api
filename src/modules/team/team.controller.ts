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

import { TeamService } from './team.service.js';
import {
  CreateTeamMemberDto,
  UpdateTeamMemberDto,
} from './dto/index.js';

@ApiTags('Team')
@Controller('team')
export class TeamController {
  constructor(private readonly service: TeamService) {}

  // ================================================================
  // PUBLIC
  // ================================================================
  @Public()
  @Get()
  @ApiOperation({ summary: 'Liste publique des membres actifs' })
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
  @ApiOperation({ summary: 'Détail admin d’un membre' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Créer un membre' })
  create(
    @Body() dto: CreateTeamMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.create(dto, user.sub);
  }

  @Patch(':id')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Modifier un membre (translations remplacées si fournies)',
  })
  update(@Param('id') id: string, @Body() dto: UpdateTeamMemberDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer un membre' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}