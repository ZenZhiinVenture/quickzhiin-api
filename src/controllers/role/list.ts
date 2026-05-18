import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';

export default async function getRoleList(req: Request, res: Response, next: NextFunction) {
  try {

    const items = await prisma.role.findMany();

    return res.status(200).json({
      message: 'Role Create Successfully',
      roles: items,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
