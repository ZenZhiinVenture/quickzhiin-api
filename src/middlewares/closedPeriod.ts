import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';
import logger from '../../utils/logger';

/**
 * Middleware: guardClosedPeriod
 *
 * Blocks write operations (POST/PUT/PATCH/DELETE) if the request body
 * contains a `date` field that falls within a CLOSED accounting period.
 *
 * Usage: apply to any route that creates/modifies dated financial records.
 * Example: router.post('/journal', guardClosedPeriod, createJournalEntry)
 */
export const guardClosedPeriod = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  // Only enforce on write operations
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Extract the date from the request body
  const dateStr = req.body?.date || req.body?.entryDate || req.body?.transactionDate;
  if (!dateStr) {
    // No date in body — allow through (controller will validate)
    return next();
  }

  try {
    const transactionDate = new Date(dateStr);

    const closedPeriod = await prisma.accountingPeriod.findFirst({
      where: {
        status: 'CLOSED',
        startDate: { lte: transactionDate },
        endDate: { gte: transactionDate },
      },
    });

    if (closedPeriod) {
      return res.status(403).json({
        status: 'error',
        message: `The period "${closedPeriod.name}" (${closedPeriod.startDate.toISOString().slice(0, 10)} → ${closedPeriod.endDate.toISOString().slice(0, 10)}) is closed. Reopen it to post transactions.`,
        code: 'PERIOD_CLOSED',
        period: {
          id: closedPeriod.id.toString(),
          name: closedPeriod.name,
        },
      });
    }

    return next();
  } catch (error: any) {
    logger.error('guardClosedPeriod error:', error);
    // Non-blocking — if period check fails, allow through to avoid blocking legitimate writes
    return next();
  }
};
