import { Request, Response, NextFunction } from 'express';
import { centralPrisma, tenantManager, tenantContext } from '../services/prisma/prismaClient';
import logger from '../utils/logger';

export const requireTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantCode = req.headers['x-tenant-code'] as string || (req as any).user?.tenantCode;

    if (!tenantCode) {
      if (process.env.NODE_ENV === 'development' && process.env.FALLBACK_TENANT_CODE) {
        req.headers['x-tenant-code'] = process.env.FALLBACK_TENANT_CODE;
      } else {
        return res.status(400).json({ message: 'Missing X-Tenant-Code header or tenant context' });
      }
    }

    const codeToLookup = req.headers['x-tenant-code'] as string || tenantCode;

    const tenant = await centralPrisma.tenant.findUnique({
      where: { code: codeToLookup }
    });

    if (!tenant) {
      return res.status(404).json({ message: `Tenant ${codeToLookup} not found` });
    }

    if (tenant.status !== 'ACTIVE') {
      return res.status(403).json({ message: `Tenant ${codeToLookup} is suspended or inactive` });
    }

    const tenantDb = tenantManager.getClient(tenant.dbUrl);

    (req as any).tenant = tenant;

    // Run all subsequent middleware and route handlers within the tenant's context!
    tenantContext.run(tenantDb, () => {
      next();
    });
  } catch (error) {
    logger.error('Error resolving tenant database:', error);
    res.status(500).json({ message: 'Failed to resolve tenant database' });
  }
};
