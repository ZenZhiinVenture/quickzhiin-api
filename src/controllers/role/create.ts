import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';
import upsertRole from 'src/services/role/upsert';

export default async function createRole(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || 1;

    const data = await upsertRole(userId, undefined, req.body.role);

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
