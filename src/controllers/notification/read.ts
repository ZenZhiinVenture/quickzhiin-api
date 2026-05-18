import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';

export default async function getNotificationDetail(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;

    const data = await prisma.notification.findUnique({
      where: {
        id: Number(id),
      },
    });
    return res.status(200).json({
      message: 'Read Notification Details Successfully',
      notification: data,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
