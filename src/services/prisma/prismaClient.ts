import { PrismaClient as TenantPrismaClient } from '@prisma/client';
import { PrismaClient as CentralPrismaClient } from '@prisma/central-client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { AsyncLocalStorage } from 'async_hooks';

// 1. Central Database Client
const centralPool = new Pool({ connectionString: process.env.CENTRAL_DATABASE_URL });
const centralAdapter = new PrismaPg(centralPool);

export const centralPrisma = new CentralPrismaClient({
  adapter: centralAdapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// 2. Async Context for Multi-Tenancy
export const tenantContext = new AsyncLocalStorage<TenantPrismaClient>();

// 3. Tenant Database Manager
class TenantManager {
  private static instance: TenantManager;
  private clients: Map<string, TenantPrismaClient> = new Map();

  private constructor() { }

  public static getInstance(): TenantManager {
    if (!TenantManager.instance) {
      TenantManager.instance = new TenantManager();
    }
    return TenantManager.instance;
  }

  public getClient(dbUrl: string): TenantPrismaClient {
    if (!dbUrl) {
      throw new Error('Database URL is required to get a tenant client');
    }

    if (this.clients.has(dbUrl)) {
      return this.clients.get(dbUrl)!;
    }

    const pool = new Pool({ connectionString: dbUrl });
    const adapter = new PrismaPg(pool);

    const client = new TenantPrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

    this.clients.set(dbUrl, client);
    return client;
  }
}

export const tenantManager = TenantManager.getInstance();

// 4. Fallback default client
const fallbackClient = tenantManager.getClient(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/quickzhiin');

// 5. The Magic Prisma Proxy
// This proxy intercepts all calls to `prisma.model.method()` and routes it to 
// the specific TenantPrismaClient injected into the current request's async context.
// If no context is found (e.g. running outside a request), it uses the fallback DB.
export const prisma = new Proxy({} as TenantPrismaClient, {
  get(target, prop) {
    const store = tenantContext.getStore();
    const activeClient = store || fallbackClient;

    // Bind functions to the correct client instance to preserve 'this' context
    const value = (activeClient as any)[prop];
    if (typeof value === 'function') {
      return value.bind(activeClient);
    }
    return value;
  }
});
