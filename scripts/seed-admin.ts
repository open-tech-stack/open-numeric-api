import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = process.env.SEED_ADMIN_USERNAME ?? 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const displayName = process.env.SEED_ADMIN_DISPLAY_NAME ?? 'Super Admin';
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@open-numeric.com';

  const existing = await prisma.admin.findUnique({ where: { username } });
  if (existing) {
    console.log(`✅ Admin "${username}" existe déjà.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.admin.create({
    data: {
      username,
      passwordHash,
      displayName,
      email,
      role: 'ADMIN',
    },
  });

  console.log(`🎉 Admin créé : ${username} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());