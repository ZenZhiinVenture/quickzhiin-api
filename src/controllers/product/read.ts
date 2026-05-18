import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';

export default async function readProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: {
        id: BigInt(id),
      },
    });

    return res.status(200).json({
      message: 'Read Success',
      product: product,
    });
  } catch (err) {
    return next(err);
  }
}
