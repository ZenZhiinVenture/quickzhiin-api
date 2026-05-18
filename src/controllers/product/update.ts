import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';
import upsertProduct from 'src/services/product/upsert';

export default async function updateProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;


    const product = await upsertProduct(req.body.product, userId || 1, Number(id));

    return res.status(200).json({
      message: 'Product create successfully',
      data: product,
    });
  } catch (err) {
    return next(err);
  }
}
