import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';

export default async function getPermissionList(req: Request, res: Response, next: NextFunction) {
  try {

    const items = await prisma.permission.findMany();

    return res.status(200).json({
      message: 'Read Permission List Sucessfully. ',
      permissions: items,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
