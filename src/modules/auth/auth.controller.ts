import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import type { AppConfig } from '../../config/configuration.js';

import { AuthService } from './auth.service.js';
import { ChangePasswordDto, LoginDto, RefreshDto, UpdateProfileDto } from './dto/index.js';
import type { JwtPayload } from './types/jwt-payload.type.js';
import {
  clearAuthCookies,
  REFRESH_COOKIE,
  setAuthCookies,
} from './utils/auth-cookies.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  private get isProd() {
    return this.config.get('app.env', { infer: true }) === 'production';
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Connexion admin (username + password)' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } = await this.authService.login(
      dto.username,
      dto.password,
    );

    setAuthCookies(res, { accessToken, refreshToken }, user, this.isProd);
    return { user };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Rafraîchir les tokens via cookie' })
  async refresh(
    @Body() _dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException('Aucun refresh token.');
    }

    const {
      accessToken,
      refreshToken: newRefresh,
      user,
    } = await this.authService.refresh(refreshToken);

    setAuthCookies(
      res,
      { accessToken, refreshToken: newRefresh },
      user,
      this.isProd,
    );
    return { user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Déconnexion admin' })
  async logout(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logout(user.sub);
    clearAuthCookies(res);
    return { success: true };
  }

   @Patch('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Mettre à jour mon profil' })
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.sub, dto);
  }

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Changer mon mot de passe' })
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.sub, dto);
  }
}