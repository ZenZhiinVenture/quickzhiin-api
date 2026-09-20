import { Request, Response, NextFunction } from 'express';
import { centralPrisma } from '../../services/prisma/prismaClient';

/**
 * Lists all users that have access to the current tenant.
 * Reads from the CENTRAL database via TenantUserAccess.
 */
export default async function getUserList(req: Request, res: Response, next: NextFunction) {
  try {
    const tenant = (req as any).tenant;

    // Get all users who have access to this tenant
    const accessList = await centralPrisma.tenantUserAccess.findMany({
      where: { tenantId: tenant.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    const users = accessList.map((a: any) => ({
      ...a.user,
      id: a.user.id.toString(),
      role: a.role,
      roleId: a.roleId?.toString(),
      accessId: a.id.toString(),
    }));

    return res.status(200).json({
      message: 'Users fetched successfully',
      users,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
    return next(err);
  }
}
