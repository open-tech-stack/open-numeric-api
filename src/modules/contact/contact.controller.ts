import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AdminRole } from '../../generated/prisma/client.js';

import { ContactService } from './contact.service.js';
import {
  CreateContactDto,
  QueryContactsDto,
  UpdateContactStatusDto,
} from './dto/index.js';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly service: ContactService) {}

  // ================================================================
  // PUBLIC — soumission (rate limited)
  // ================================================================
  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Soumettre un message de contact (3 / minute max)',
  })
  create(@Body() dto: CreateContactDto, @Req() req: Request) {
    return this.service.create(dto, {
      ip: (req.ip ?? req.socket?.remoteAddress) ?? undefined,
      userAgent: req.headers['user-agent'],
    });
  }

  // ================================================================
  // ADMIN — liste paginée + filtres
  // ================================================================
  @Get()
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Liste paginée des messages (filtre status + search)',
  })
  findAll(@Query() query: QueryContactsDto) {
    return this.service.findAllAdmin(query);
  }

  @Get(':id')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Détail d’un message' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id/status')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Changer le statut (NEW/READ/REPLIED/ARCHIVED/SPAM)' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateContactStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }

  @Delete(':id')
  @Roles(AdminRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Supprimer un message (ADMIN uniquement)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}