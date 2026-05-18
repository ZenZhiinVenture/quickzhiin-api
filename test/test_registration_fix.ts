import bcrypt from 'bcrypt';
import { registerTenant, registerUser } from '../src/services/auth/register';
import { CorePrismaClientManager } from './src/services/prisma/coreClient';

async function testRegistration() {
  console.log('--- Starting Registration Fix Verification ---');
  const timestamp = Date.now();
  const email = `testfix_${timestamp}@demo.com`;
  const subdomain = `fixdemo${timestamp}`;

  try {
    console.log(`1. Testing Tenant Registration for: ${subdomain}...`);
    const tenant = await registerTenant({
      companyName: 'Fix Verification Corp',
      subdomain: subdomain,
      primaryContactName: 'Fix Tester',
      primaryContactEmail: email,
      dbHost: 'localhost',
      dbPort: 5432,
      dbName: `tenant_${subdomain}`,
      dbUser: 'postgres',
      dbPasswordEncrypted: 'password', // Raw password, service will encrypt
      status: 'active',
    });
    console.log('✅ Tenant Registered and DB Provisioned successfully!');

    console.log(`2. Testing User Registration for: ${email}...`);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123!', salt);

    const user = await registerUser({
      email,
      passwordHash: hashedPassword,
      firstName: 'Fix',
      lastName: 'Tester',
      phone: '1234567890',
      role: 'owner',
      defaultTenantId: tenant.id,
      status: 'active',
    });
    console.log('✅ User Registered and Synced to Tenant DB successfully!');

    // Cleanup: We should probably keep it for a moment to inspect, 
    // but for automated test we can remove from Core DB.
    // Note: Database itself remains for manual inspection if needed.
    const coreDb = CorePrismaClientManager.getInstance().getClient();
    // No cleanup for now to allow inspection if needed

    console.log('--- Verification Complete: FIX CONFIRMED ---');
  } catch (error: any) {
    console.error('❌ Verification Failed!');
    console.error(error);
    process.exit(1);
  }
}

testRegistration().then(() => process.exit(0));
