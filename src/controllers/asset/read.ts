import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';

export default async function getAssetDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const data = await prisma.asset.findFirst({
      where: {
        id: Number(id),
      },
    });

    return res.status(200).json({
      message: 'Asset read sucessfully.',
      asset: data,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
