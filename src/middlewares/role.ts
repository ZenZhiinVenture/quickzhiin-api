import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/prisma/prismaClient';

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: BigInt(req.user.id) },
      include: { role: true },
    });

    if (!user || user.role.name !== 'Admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    return next();
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
