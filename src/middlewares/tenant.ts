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
        return res.status(400).json({ message: 'Missing X-Tenant-Code header' });
      }
    }

    const codeToLookup = req.headers['x-tenant-code'] as string || tenantCode;

    const tenant = await centralPrisma.tenant.findUnique({
      where: { code: codeToLookup }
    });

    if (!tenant) {
      return res.status(404).json({ message: `Tenant '${codeToLookup}' not found` });
    }

    if (tenant.status !== 'ACTIVE') {
      return res.status(403).json({ message: `Tenant '${codeToLookup}' is suspended` });
    }

    // Validate that the requesting user has access to this tenant
    const userId = (req as any).user?.id;
    if (userId) {
      const access = await centralPrisma.tenantUserAccess.findUnique({
        where: {
          userId_tenantId: {
            userId: BigInt(userId),
            tenantId: tenant.id,
          },
        },
      });

      if (!access) {
        // In development, allow if no access record exists (for initial setup)
        if (process.env.NODE_ENV !== 'development') {
          return res.status(403).json({ message: 'Access denied to this company' });
        }
      } else {
        // Attach access info for use in controllers
        (req as any).tenantAccess = {
          role: access.role,
          roleId: access.roleId ? Number(access.roleId) : undefined,
        };
      }
    }

    (req as any).tenant = tenant;

    const tenantDb = tenantManager.getClient(tenant.dbUrl);

    tenantContext.run(tenantDb, () => {
      next();
    });
  } catch (error) {
    logger.error('Error resolving tenant database:', error);
    res.status(500).json({ message: 'Failed to resolve tenant database' });
  }
};
