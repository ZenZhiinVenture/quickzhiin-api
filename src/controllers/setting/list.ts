import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';

export default async function getSettingList(req: Request, res: Response, next: NextFunction) {
  try {

    const items = await prisma.setting.findMany();

    return res.status(200).json({
      message: 'Read setting list successfully.',
      settings: items,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
