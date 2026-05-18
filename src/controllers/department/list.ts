import { Request, Response, NextFunction } from 'express';
import { paginatedQuery } from 'src/helpers/paginatedQuery';
import { prisma } from '../../services/prisma/prismaClient';

export default async function getDepartmentList(req: Request, res: Response, next: NextFunction) {
  try {

    const items = await paginatedQuery(prisma.department, req.body);

    return res.status(200).json({
      message: 'Read Department List Successfully.',
      items,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
