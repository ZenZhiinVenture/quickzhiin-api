import { Client } from 'pg';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { centralPrisma, tenantManager } from '../prisma/prismaClient';
import logger from '../../utils/logger';
import bcrypt from 'bcrypt';

const execAsync = util.promisify(exec);

export const tenantProvisionerService = {
  /**
   * Provisions a new database for a tenant and creates an admin user.
   */
  async provisionNewTenant(
    companyName: string,
    companyCode: string,
    adminEmail: string,
    adminPasswordRaw: string
  ) {
    logger.info(`Starting provisioning for tenant: ${companyCode}`);
    
    // 1. Check if code is taken
    const existing = await centralPrisma.tenant.findUnique({ where: { code: companyCode } });
    if (existing) {
      throw new Error(`Tenant code '${companyCode}' is already in use.`);
    }

    // 2. Generate Database Name
    const dbName = `quickzhiin_tenant_${companyCode.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${Date.now()}`;
    const baseUrl = process.env.POSTGRES_BASE_URL || 'postgresql://postgres:postgres@localhost:5432';
    const dbUrl = `${baseUrl}/${dbName}`;

    // 3. Create the Database in PostgreSQL
    const client = new Client({
      connectionString: `${baseUrl}/postgres` // Connect to default db to create new one
    });

    try {
      await client.connect();
      await client.query(`CREATE DATABASE "${dbName}"`);
      logger.info(`Database ${dbName} created successfully.`);
    } catch (error) {
      logger.error(`Failed to create database ${dbName}`, error);
      throw error;
    } finally {
      await client.end();
    }

    // 4. Run Prisma Migrations to generate tables
    try {
      logger.info(`Running migrations for ${dbName}...`);
      // We must run it from the quickzhiin-api directory
      const apiDir = path.resolve(__dirname, '../../../');
      
      const { stdout, stderr } = await execAsync(`npx prisma migrate deploy --schema prisma/schema.prisma`, {
        cwd: apiDir,
        env: {
          ...process.env,
          DATABASE_URL: dbUrl // Override DATABASE_URL for this child process
        }
      });
      logger.info(`Migrations finished: ${stdout}`);
      if (stderr) logger.warn(`Migration stderr: ${stderr}`);
    } catch (error) {
      logger.error(`Migration failed for ${dbName}`, error);
      throw error;
    }

    // 5. Create Tenant Record in Central DB
    const tenant = await centralPrisma.tenant.create({
      data: {
        code: companyCode,
        name: companyName,
        dbName: dbName,
        dbUrl: dbUrl,
        status: 'ACTIVE'
      }
    });

    // 6. Connect to the new Tenant DB and create the Admin User
    try {
      const tenantDb = tenantManager.getClient(dbUrl);
      const hashedPassword = await bcrypt.hash(adminPasswordRaw, 10);
      
      // We also need an Admin Role first. Let's create it.
      const adminRole = await tenantDb.role.create({
        data: {
          name: 'ADMIN',
          description: 'System Administrator'
        }
      });

      const user = await tenantDb.user.create({
        data: {
          email: adminEmail,
          passwordHash: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          roleId: adminRole.id
        }
      });
      logger.info(`Admin user created for tenant ${companyCode}: ${user.email}`);
    } catch (error) {
      logger.error(`Failed to create initial data for tenant ${dbName}`, error);
      throw error;
    }

    return tenant;
  }
};
