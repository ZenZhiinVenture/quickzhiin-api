import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';
import upsertTax from 'src/services/tax/upsert';

export default async function createTax(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || 1;

    const data = await upsertTax(userId, undefined, req.body.taxCode);
    return res.status(200).json({
      message: 'Create Tax Code Successfully.',
      taxCode: data,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
