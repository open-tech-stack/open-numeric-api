import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

import { UploadsRepository } from './repositories/uploads.repository.js';
import type { QueryUploadsDto } from './dto/index.js';
import type {
  PaginatedUploads,
  UploadResponse,
} from './types/upload-response.type.js';
import {
  UPLOADS_DIR,
  UPLOADS_PUBLIC_PATH,
} from './utils/multer.config.js';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(private readonly repo: UploadsRepository) {}

  // ================================================================
  // UPLOAD — fichier unique
  // ================================================================
  async uploadOne(
    file: Express.Multer.File,
    adminId: string,
  ): Promise<UploadResponse> {
    const url = `${UPLOADS_PUBLIC_PATH}/${file.filename}`;

    const created = await this.repo.create({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      url,
      uploadedBy: { connect: { id: adminId } },
    });

    this.logger.log(
      `Fichier uploadé : ${file.filename} (${(file.size / 1024).toFixed(1)} Ko)`,
    );

    return this.toResponse(created);
  }

  // ================================================================
  // UPLOAD — plusieurs fichiers
  // ================================================================
  async uploadMany(
    files: Express.Multer.File[],
    adminId: string,
  ): Promise<UploadResponse[]> {
    const results: UploadResponse[] = [];

    for (const file of files) {
      const result = await this.uploadOne(file, adminId);
      results.push(result);
    }

    return results;
  }

  // ================================================================
  // ADMIN — liste paginée
  // ================================================================
  async findAllAdmin(query: QueryUploadsDto): Promise<PaginatedUploads> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Record<string, unknown> = {};
    if (query.search) {
      where.originalName = { contains: query.search, mode: 'insensitive' };
    }

    const { items, total } = await this.repo.findAll({
      where,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((u) => this.toResponse(u)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findById(id: string): Promise<UploadResponse> {
    const upload = await this.repo.findById(id);
    if (!upload) throw new NotFoundException('Fichier introuvable.');
    return this.toResponse(upload);
  }

  // ================================================================
  // DELETE — supprime DB + fichier disque
  // ================================================================
  async remove(id: string) {
    const upload = await this.repo.findById(id);
    if (!upload) throw new NotFoundException('Fichier introuvable.');

    // 1. Supprimer le fichier sur le disque
    const filePath = join(UPLOADS_DIR, upload.filename);
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
      } catch (err) {
        this.logger.warn(
          `Impossible de supprimer ${filePath} : ${(err as Error).message}`,
        );
      }
    }

    // 2. Supprimer l'entrée en DB
    await this.repo.delete(id);

    this.logger.log(`Fichier supprimé : ${upload.filename}`);
    return { success: true };
  }

  // ================================================================
  // MAPPER
  // ================================================================
  private toResponse(upload: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    createdAt: Date;
  }): UploadResponse {
    return {
      id: upload.id,
      filename: upload.filename,
      originalName: upload.originalName,
      mimeType: upload.mimeType,
      size: upload.size,
      url: upload.url,
      createdAt: upload.createdAt.toISOString(),
    };
  }
}