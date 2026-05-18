import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';
import upsertProduct from 'src/services/product/upsert';

export default async function createProduct(req: Request, res: Response, next: NextFunction) {
  try {
    const { product } = req.body;

    const userId = req.user?.id;

    const result = await upsertProduct(product, userId || 1, undefined);

    return res.status(200).json({
      message: 'Succefully',
      product: result,
    });
  } catch (err) {
    return next(err);
  }
}
