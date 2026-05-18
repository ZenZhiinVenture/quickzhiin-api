import { Request, Response, NextFunction } from 'express';
import { paginatedQuery } from 'src/helpers/paginatedQuery';
import { prisma } from '../../services/prisma/prismaClient';

export default async function getTaxList(req: Request, res: Response, next: NextFunction) {
  try {

    const items = await paginatedQuery(prisma.taxCode, req);

    return res.status(200).json({
      message: 'Read Tax Codes Successfully.',
      taxCodes: items,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
