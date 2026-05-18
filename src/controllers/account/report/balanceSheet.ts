import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../services/prisma/prismaClient';
import { reportingService } from '../../../services/account/report';

/**
 * Get Balance Sheet report
 */
export default async function getBalanceSheet(req: Request, res: Response, next: NextFunction) {
  try {
    const { date } = req.query;
    const end = date ? new Date(date as string) : new Date();

    const report = await reportingService.getBalanceSheet(prisma, end);

    return res.status(200).json({
      status: 'success',
      data: report,
    });
  } catch (error) {
    return next(error);
  }
}
