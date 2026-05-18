import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';
import upsertRole from 'src/services/role/upsert';

export default async function functionName(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 1;

    const data = await upsertRole(userId, Number(id), req.body.role);

    return res.status(200).json({
      message: 'Update Role successfully',
      role: data,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
