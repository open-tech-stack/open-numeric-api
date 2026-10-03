import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { AdminRole } from '../../generated/prisma/client.js';
import type { JwtPayload } from '../auth/types/jwt-payload.type.js';

import { UploadsService } from './uploads.service.js';
import { QueryUploadsDto } from './dto/index.js';
import {
  imageUploadOptions,
  MAX_FILE_SIZE,
  multipleImagesUploadOptions,
} from './utils/multer.config.js';

@ApiTags('Uploads')
@ApiBearerAuth('access-token')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly service: UploadsService) {}

  // ================================================================
  // UPLOAD — fichier unique
  // ================================================================
  @Post()
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiOperation({
    summary: `Uploader une image (max ${MAX_FILE_SIZE / 1024 / 1024} Mo)`,
  })
  uploadOne(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni.');
    }
    return this.service.uploadOne(file, user.sub);
  }

  // ================================================================
  // UPLOAD — plusieurs fichiers
  // ================================================================
  @Post('multiple')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @UseInterceptors(FilesInterceptor('files', 10, multipleImagesUploadOptions))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiOperation({
    summary: `Uploader jusqu’à 10 images (max ${MAX_FILE_SIZE / 1024 / 1024} Mo chacune)`,
  })
  uploadMany(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: JwtPayload,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Aucun fichier fourni.');
    }
    return this.service.uploadMany(files, user.sub);
  }

  // ================================================================
  // ADMIN — liste paginée
  // ================================================================
  @Get()
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiOperation({ summary: 'Lister les fichiers uploadés (paginé)' })
  findAll(@Query() query: QueryUploadsDto) {
    return this.service.findAllAdmin(query);
  }

  @Get(':id')
  @Roles(AdminRole.ADMIN, AdminRole.EDITOR)
  @ApiOperation({ summary: 'Détail d’un fichier' })
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  // ================================================================
  // DELETE
  // ================================================================
  @Delete(':id')
  @Roles(AdminRole.ADMIN)
  @ApiOperation({ summary: 'Supprimer un fichier (disque + DB)' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}