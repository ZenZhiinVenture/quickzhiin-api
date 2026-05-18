import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';
import upsertTax from 'src/services/tax/upsert';

export default async function updateTax(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 1;
    const data = await upsertTax(userId, Number(id), req.body.taxCode);

    return res.status(200).json({
      message: 'Update Tax Code Successfully.',
      taxCode: data,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
