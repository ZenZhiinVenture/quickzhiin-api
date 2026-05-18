import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

class PrismaClientManager {
  private static instance: PrismaClientManager;
  private client: PrismaClient;

  private constructor() {
    // In Prisma 7, you must explicitly provide an adapter for direct DB connections
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    this.client = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  public static getInstance(): PrismaClientManager {
    if (!PrismaClientManager.instance) {
      PrismaClientManager.instance = new PrismaClientManager();
    }
    return PrismaClientManager.instance;
  }

  public getClient(): PrismaClient {
    return this.client;
  }
}

export const prismaManager = PrismaClientManager.getInstance();
export const prisma = prismaManager.getClient();
