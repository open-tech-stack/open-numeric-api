import { BadRequestException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js';
import type { Request } from 'express';
import { diskStorage } from 'multer';

/** Dossier de destination (hors `dist/`) */
export const UPLOADS_DIR = join(process.cwd(), 'public', 'uploads');

/** URL publique des fichiers (servie par Nest) */
export const UPLOADS_PUBLIC_PATH = '/uploads';

/** Types MIME autorisés */
const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'image/avif',
];

/** Extensions autorisées (double sécurité) */
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.avif'];

/** Taille max : 5 Mo */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Assure que le dossier d'upload existe.
 */
function ensureUploadDir() {
  if (!existsSync(UPLOADS_DIR)) {
    mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Génère un nom de fichier unique et propre.
 * Format : <timestamp>-<random>.<ext>
 */
function generateFilename(originalName: string): string {
  const ext = extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const random = randomBytes(6).toString('hex');
  return `${timestamp}-${random}${ext}`;
}

/**
 * Filtre de validation du fichier.
 */
function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  const ext = extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return callback(
      new BadRequestException(
        `Type MIME non autorisé : ${file.mimetype}. Autorisés : ${ALLOWED_MIME.join(', ')}`,
      ),
      false,
    );
  }

  if (!ALLOWED_EXT.includes(ext)) {
    return callback(
      new BadRequestException(
        `Extension non autorisée : ${ext}. Autorisées : ${ALLOWED_EXT.join(', ')}`,
      ),
      false,
    );
  }

  return callback(null, true);
}

/**
 * Options Multer pour l'upload d'une image.
 */
export const imageUploadOptions: MulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, callback) => {
      ensureUploadDir();
      callback(null, UPLOADS_DIR);
    },
    filename: (_req, file, callback) => {
      callback(null, generateFilename(file.originalname));
    },
  }),
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
};

/**
 * Options Multer pour l'upload multiple (jusqu'à 10 images).
 */
export const multipleImagesUploadOptions: MulterOptions = {
  ...imageUploadOptions,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10,
  },
};