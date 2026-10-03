import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AdminRole } from '../../generated/prisma/client.js';
import type { JwtPayload } from '../auth/types/jwt-payload.type.js';

import { SettingsService } from './settings.service.js';
import { UpdateSettingsWithTranslationsDto } from './dto/index.js';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  // ----------------------------------------------------------------
  // PUBLIC — le front consomme ce endpoint au boot
  // ----------------------------------------------------------------
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Récupérer la configuration publique du site',
  })
  getPublic() {
    return this.service.getPublic();
  }

  // ----------------------------------------------------------------
  // ADMIN — mise à jour
  // ----------------------------------------------------------------
  @Patch()
  @Roles(AdminRole.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Mettre à jour la configuration (ADMIN uniquement)',
  })
  update(
    @Body() dto: UpdateSettingsWithTranslationsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.update(dto, user.sub);
  }
}