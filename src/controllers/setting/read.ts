import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';

export default async function getSettingDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const { key } = req.params;

    const data = prisma.setting.findUnique({
      where: {
        key: key,
      },
    });

    return res.status(200).json({
      message: 'Read Setting details succesfully',
      setting: data,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
