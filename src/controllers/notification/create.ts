import { Request, Response, NextFunction } from 'express';
import upsertNotification from 'src/services/notifications/upsert';
import { prisma } from '../../services/prisma/prismaClient';

export default async function createNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || 1;

    const data = await upsertNotification(userId, undefined, req.body.notification);

    return res.status(200).json({
      message: 'Create Notification Successfully',
      notification: data,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
