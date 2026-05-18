import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';
import { reportingService } from 'src/services/account/report';

/**
 * GET /api/report/profit-and-loss
 */
export async function getProfitAndLoss(req: Request, res: Response, next: NextFunction) {
  try {
    
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const report = await reportingService.getProfitAndLoss(prisma, startDate, endDate);

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
    return next(err);
  }
}

/**
 * GET /api/report/balance-sheet
 */
export async function getBalanceSheet(req: Request, res: Response, next: NextFunction) {
  try {
    
    const date = req.query.date ? new Date(req.query.date as string) : new Date();

    const report = await reportingService.getBalanceSheet(prisma, date);

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
    return next(err);
  }
}

/**
 * GET /api/report/general-ledger
 */
export async function getGeneralLedger(req: Request, res: Response, next: NextFunction) {
  try {
    
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const report = await reportingService.getGeneralLedger(prisma, startDate, endDate);

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
    return next(err);
  }
}

/**
 * GET /api/report/trial-balance
 */
export async function getTrialBalance(req: Request, res: Response, next: NextFunction) {
  try {
    
    const date = req.query.date ? new Date(req.query.date as string) : new Date();

    const report = await reportingService.getTrialBalance(prisma, date);

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
    return next(err);
  }
}
