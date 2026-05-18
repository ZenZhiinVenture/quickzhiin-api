import { Request, Response, NextFunction } from 'express';
import { paginatedQuery } from 'src/helpers/paginatedQuery';
import { prisma } from '../../services/prisma/prismaClient';

export default async function getAssetList(req: Request, res: Response, next: NextFunction) {
  try {

    const items = await paginatedQuery(prisma.asset, req, {});

    return res.status(200).json({
      message: 'Get Asset List Successfully',
      items,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
