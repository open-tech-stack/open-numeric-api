import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import type { Admin } from '../../generated/prisma/client.js';
import type { AppConfig } from '../../config/configuration.js';
import { AdminRepository } from '../admin/repositories/admin.repository.js';
import type { JwtPayload } from './types/jwt-payload.type.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async login(username: string, password: string) {
    const admin = await this.adminRepo.findByUsername(username);
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    const matches = await bcrypt.compare(password, admin.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    await this.adminRepo.updateLastLogin(admin.id);

    const tokens = await this.issueTokens(admin);
    this.logger.log(`Login admin : ${admin.username} (${admin.role})`);

    return tokens;
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get('jwt.refreshSecret', { infer: true }),
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré.');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Type de token invalide.');
    }

    const admin = await this.adminRepo.findById(payload.sub);
    if (!admin || !admin.refreshTokenHash || !admin.isActive) {
      throw new UnauthorizedException('Session expirée.');
    }

    const matches = await bcrypt.compare(
      refreshToken,
      admin.refreshTokenHash,
    );
    if (!matches) {
      throw new UnauthorizedException('Session révoquée.');
    }

    return this.issueTokens(admin);
  }

  /* ---------------- UPDATE PROFILE ---------------- */
  async updateProfile(adminId: string, dto: UpdateProfileDto) {
    const admin = await this.adminRepo.findById(adminId);
    if (!admin) throw new UnauthorizedException();

    const updated = await this.adminRepo.update(adminId, {
      ...(dto.displayName !== undefined && { displayName: dto.displayName }),
      ...(dto.email !== undefined && { email: dto.email || null }),
    });

    return {
      id: updated.id,
      username: updated.username,
      displayName: updated.displayName,
      email: updated.email,
      role: updated.role,
    };
  }

  /* ---------------- CHANGE PASSWORD ---------------- */
  async changePassword(adminId: string, dto: ChangePasswordDto) {
    const admin = await this.adminRepo.findById(adminId);
    if (!admin) throw new UnauthorizedException();

    const matches = await bcrypt.compare(dto.currentPassword, admin.passwordHash);
    if (!matches) {
      throw new BadRequestException('Mot de passe actuel incorrect.');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await this.adminRepo.update(adminId, { passwordHash: newHash });

    // Sécurité : on révoque les refresh tokens existants
    await this.adminRepo.updateRefreshHash(adminId, null);

    this.logger.log(`Mot de passe modifié : ${admin.username}`);
    return { success: true };
  }

  async logout(adminId: string) {
    await this.adminRepo.updateRefreshHash(adminId, null);
    return { success: true };
  }

  async me(adminId: string) {
    const admin = await this.adminRepo.findById(adminId);
    if (!admin) throw new UnauthorizedException();

    return {
      id: admin.id,
      username: admin.username,
      displayName: admin.displayName,
      email: admin.email,
      role: admin.role,
    };
  }

  private async issueTokens(admin: Admin) {
    const accessPayload: JwtPayload = {
      sub: admin.id,
      role: admin.role,
      type: 'access',
    };
    const refreshPayload: JwtPayload = {
      sub: admin.id,
      role: admin.role,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload, {
        secret: this.config.get('jwt.accessSecret', { infer: true }),
        expiresIn: this.config.get('jwt.accessExpiresIn', { infer: true }),
      }),
      this.jwt.signAsync(refreshPayload, {
        secret: this.config.get('jwt.refreshSecret', { infer: true }),
        expiresIn: this.config.get('jwt.refreshExpiresIn', { infer: true }),
      }),
    ]);

    const hash = await bcrypt.hash(refreshToken, 10);
    await this.adminRepo.updateRefreshHash(admin.id, hash);

    return {
      accessToken,
      refreshToken,
      user: {
        id: admin.id,
        username: admin.username,
        displayName: admin.displayName,
        email: admin.email,
        role: admin.role,
      },
    };
  }
}