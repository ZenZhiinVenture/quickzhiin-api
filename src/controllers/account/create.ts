import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';
import upsertAccount from '../../services/account/upsert';

export default async function createAccount(req: Request, res: Response, _next: NextFunction) {
  try {
    const userId = (req as any).user?.id || 1;

    const data = await upsertAccount(req.body, userId, undefined);

    return res.status(200).json({
      message: 'Account Created Successfully',
      account: data,
    });
  } catch (err: any) {
    return res.status(500).json({
      message: err.message,
    });
  }
}
