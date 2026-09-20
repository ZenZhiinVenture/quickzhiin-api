/**
 * One-time migration script: moves existing tenant users into the central database.
 * 
 * Run with: npx ts-node -r tsconfig-paths/register prisma/migrations/migrate-users-to-central.ts
 * 
 * WARNING: Run ONCE only. Safe to re-run (uses upsert), but not needed again.
 */

require('module-alias/register');

import { PrismaClient as CentralPrismaClient } from '@prisma/central-client';
import { PrismaClient as TenantPrismaClient } from '@prisma/client';

const centralPrisma = new CentralPrismaClient({
  datasourceUrl: process.env.CENTRAL_DATABASE_URL,
});

const tenantPrisma = new TenantPrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function migrate() {
  console.log('Starting user migration to central database...');

  // 1. Get the tenant record from central DB (using FALLBACK_TENANT_CODE or first tenant)
  const tenantCode = process.env.FALLBACK_TENANT_CODE || 'default';
  const tenant = await centralPrisma.tenant.findFirst();

  if (!tenant) {
    console.error('No tenant found in central database. Create a tenant record first.');
    process.exit(1);
  }

  console.log(`Migrating users to tenant: ${tenant.code} (${tenant.name})`);

  // 2. Get all users from the tenant database
  // Note: After schema migration, the users table will be gone from tenant DB.
  // Run this script BEFORE applying the schema.prisma migration.
  const tenantUsers = await (tenantPrisma as any).$queryRaw`
    SELECT id, email, password_hash, first_name, last_name, phone, status, is_active
    FROM users
    ORDER BY id ASC
  ` as any[];

  console.log(`Found ${tenantUsers.length} users in tenant database`);

  let created = 0;
  let skipped = 0;

  for (const u of tenantUsers) {
    // 3. Upsert into central users table
    const centralUser = await centralPrisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        passwordHash: u.password_hash,
        firstName: u.first_name,
        lastName: u.last_name,
        phone: u.phone,
        status: u.status || 'active',
        isActive: u.is_active ?? true,
      },
    });

    // 4. Create TenantUserAccess mapping (as OWNER by default)
    const existing = await centralPrisma.tenantUserAccess.findUnique({
      where: { userId_tenantId: { userId: centralUser.id, tenantId: tenant.id } },
    });

    if (!existing) {
      await centralPrisma.tenantUserAccess.create({
        data: {
          userId: centralUser.id,
          tenantId: tenant.id,
          role: 'OWNER',
        },
      });
      created++;
      console.log(`  ✓ Migrated: ${u.email}`);
    } else {
      skipped++;
      console.log(`  - Skipped (already exists): ${u.email}`);
    }
  }

  console.log(`\nMigration complete: ${created} migrated, ${skipped} skipped`);
  await centralPrisma.$disconnect();
  await tenantPrisma.$disconnect();
}

migrate().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
