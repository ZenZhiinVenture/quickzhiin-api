import { Request, Response, NextFunction } from 'express';
import update from 'src/services/setting//update';
import { prisma } from '../../services/prisma/prismaClient';

export default async function updateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || 1;
    await update(userId, req.body.settings);

    return res.status(200).json({
      message: 'Update setting successfully.',
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
