import { Request, Response, NextFunction } from 'express';
import upsertAsset from 'src/services/asset/upsert';
import { prisma } from '../../services/prisma/prismaClient';

export default async function updateAsset(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 1;

    const data = await upsertAsset(userId, Number(id), req.body.asset);

    return res.status(200).json({
      message: 'Asset Update Succesfully.',
      data,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
