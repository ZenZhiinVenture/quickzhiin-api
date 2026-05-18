import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';

export default async function deleteRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    await prisma.role.delete({
      where: {
        id: Number(id),
      },
    });

    await prisma.rolePermission.deleteMany({
      where: {
        roleId: Number(id),
      },
    });

    return res.status(200).json({
      message: 'Role Create Successfully',
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
