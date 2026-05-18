import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Create Roles
  const roles = [
    { name: 'Admin', description: 'System Administrator' },
    { name: 'User', description: 'Standard User' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        description: role.description,
      },
    });
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'Admin' } });
  if (!adminRole) throw new Error('Admin role not found');

  // 2. Create Default Admin User
  const adminEmail = 'admin@admin.com';
  const adminPassword = 'password';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hashedPassword,
      roleId: adminRole.id,
    },
    create: {
      email: adminEmail,
      passwordHash: hashedPassword,
      roleId: adminRole.id,
      firstName: 'System',
      lastName: 'Administrator',
      status: 'active',
    },
  });

  console.log('Seed completed successfully!');
  console.log(`Default Account: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
