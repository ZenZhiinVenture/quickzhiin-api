import { Request, Response, NextFunction } from 'express';
import { paginatedQuery } from 'src/helpers/paginatedQuery';
import { prisma } from '../../services/prisma/prismaClient';

export default async function getProductList(req: Request, res: Response, next: NextFunction) {
  try {
    const { isActive } = req.params;


    let filter = {
      isActive: false,
    };

    if (isActive) {
      filter.isActive = true;
    }

    const select = {
      id: true,
      name: true,
      sku: true,
      description: true,
      salePrice: true,
      purchasePrice: true,
      classificationCode: true,
      quantityOnHand: true,
      isActive: true,
    };

    const search = req.query.search as string;

    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await paginatedQuery(prisma.product, req, select, where);

    return res.status(200).json({
      message: 'Read Success',
      products: products,
    });
  } catch (err) {
    return next(err);
  }
}
