import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../services/prisma/prismaClient';
import { reportingService } from '../../../services/account/report';

/**
 * Get Profit and Loss report
 */
export default async function getProfitAndLoss(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const report = await reportingService.getProfitAndLoss(prisma, start, end);

    return res.status(200).json({
      status: 'success',
      data: report,
    });
  } catch (error) {
    return next(error);
  }
}
