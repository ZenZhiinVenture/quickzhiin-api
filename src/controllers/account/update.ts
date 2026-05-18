import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';
import upsertAccount from '../../services/account/upsert';

export default async function updateAccount(req: Request, res: Response, _next: NextFunction) {
  try {
    const userId = (req as any).user?.id || 1;
    const { id } = req.params;

    const data = await upsertAccount(req.body, userId, Number(id));

    return res.status(200).json({
      message: 'Account Updated Successfully',
      account: data,
    });
  } catch (err: any) {
    return res.status(500).json({
      message: err.message,
    });
  }
}
