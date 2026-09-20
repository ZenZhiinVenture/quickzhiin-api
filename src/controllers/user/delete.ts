import { Request, Response, NextFunction } from 'express';
import { centralPrisma } from '../../services/prisma/prismaClient';

export default async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const tenant = (req as any).tenant;

    const userToDelete = await centralPrisma.user.findUnique({ 
      where: { id: BigInt(id) },
    });

    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (tenant) {
      // Remove access to this tenant
      await centralPrisma.tenantUserAccess.deleteMany({
        where: { userId: BigInt(id), tenantId: tenant.id },
      });
    } else {
      await centralPrisma.user.delete({
        where: { id: BigInt(id) },
      });
    }

    return res.status(200).json({
      message: 'User deleted successfully',
    });
  } catch (err: any) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
