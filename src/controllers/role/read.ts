import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';

export default async function getRoleDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const data = await prisma.role.findUnique({
      where: {
        id: Number(id),
      },
    });

    return res.status(200).json({
      message: 'Role Create Successfully',
      role: data,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
