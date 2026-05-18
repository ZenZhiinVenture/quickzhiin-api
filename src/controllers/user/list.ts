import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';

export default async function getUserList(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await prisma.user.findMany({
      include: {
        role: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Serialize BigInt to string for JSON response
    const serializedItems = items.map(user => ({
      ...user,
      id: user.id.toString(),
      roleId: user.roleId.toString(),
      createdBy: user.createdBy?.toString(),
      updatedBy: user.updatedBy?.toString(),
    }));

    return res.status(200).json({
      message: 'Users fetched successfully',
      users: serializedItems,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
