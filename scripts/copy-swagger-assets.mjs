import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const SOURCE = resolve('node_modules/swagger-ui-dist');
const TARGET = resolve('dist/swagger-ui');

if (!existsSync(SOURCE)) {
  console.error('❌ swagger-ui-dist introuvable. Lance `npm install` d\'abord.');
  process.exit(1);
}

if (existsSync(TARGET)) {
  rmSync(TARGET, { recursive: true, force: true });
}

mkdirSync(TARGET, { recursive: true });
cpSync(SOURCE, TARGET, { recursive: true });

console.log('✅ Swagger UI assets copiés dans dist/swagger-ui');