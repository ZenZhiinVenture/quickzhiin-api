import { Request, Response } from 'express';
import { prisma } from '../../../services/prisma/prismaClient';
import logger from '../../../utils/logger';

/**
 * GET /api/accounting/period
 * List all accounting periods, ordered by start date descending.
 */
export const listPeriods = async (req: Request, res: Response): Promise<any> => {
  try {
    const periods = await prisma.accountingPeriod.findMany({
      orderBy: { startDate: 'desc' },
    });
    return res.status(200).json({ status: 'success', data: periods });
  } catch (error: any) {
    logger.error('Error listing accounting periods:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to list accounting periods' });
  }
};

/**
 * POST /api/accounting/period
 * Create a new accounting period.
 * Body: { name, startDate, endDate, notes? }
 */
export const createPeriod = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, startDate, endDate, notes } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ status: 'error', message: 'name, startDate, and endDate are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return res.status(400).json({ status: 'error', message: 'endDate must be after startDate' });
    }

    // Check for overlapping open periods
    const overlap = await prisma.accountingPeriod.findFirst({
      where: {
        status: 'OPEN',
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
        ],
      },
    });

    if (overlap) {
      return res.status(409).json({
        status: 'error',
        message: `Period overlaps with existing period: "${overlap.name}" (${overlap.startDate.toISOString().slice(0, 10)} → ${overlap.endDate.toISOString().slice(0, 10)})`,
      });
    }

    const period = await prisma.accountingPeriod.create({
      data: { name, startDate: start, endDate: end, notes },
    });

    return res.status(201).json({ status: 'success', data: period });
  } catch (error: any) {
    logger.error('Error creating accounting period:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to create accounting period' });
  }
};

/**
 * PATCH /api/accounting/period/:id/close
 * Close (lock) an accounting period. No new transactions can be posted to closed periods.
 */
export const closePeriod = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = BigInt(req.params.id);
    const user = (req as any).user;

    const existing = await prisma.accountingPeriod.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ status: 'error', message: 'Period not found' });
    if (existing.status === 'CLOSED') {
      return res.status(409).json({ status: 'error', message: 'Period is already closed' });
    }

    const period = await prisma.accountingPeriod.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closedBy: user?.email || user?.id?.toString() || 'system',
      },
    });

    return res.status(200).json({ status: 'success', data: period });
  } catch (error: any) {
    logger.error('Error closing accounting period:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to close accounting period' });
  }
};

/**
 * PATCH /api/accounting/period/:id/reopen
 * Reopen a closed period (admin override).
 */
export const reopenPeriod = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = BigInt(req.params.id);

    const existing = await prisma.accountingPeriod.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ status: 'error', message: 'Period not found' });
    if (existing.status === 'OPEN') {
      return res.status(409).json({ status: 'error', message: 'Period is already open' });
    }

    const period = await prisma.accountingPeriod.update({
      where: { id },
      data: { status: 'OPEN', closedAt: null, closedBy: null },
    });

    return res.status(200).json({ status: 'success', data: period });
  } catch (error: any) {
    logger.error('Error reopening accounting period:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to reopen accounting period' });
  }
};

/**
 * DELETE /api/accounting/period/:id
 * Delete a period (only if OPEN and has no transactions within its range).
 */
export const deletePeriod = async (req: Request, res: Response): Promise<any> => {
  try {
    const id = BigInt(req.params.id);

    const existing = await prisma.accountingPeriod.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ status: 'error', message: 'Period not found' });
    if (existing.status === 'CLOSED') {
      return res.status(409).json({ status: 'error', message: 'Cannot delete a closed period. Reopen it first.' });
    }

    await prisma.accountingPeriod.delete({ where: { id } });
    return res.status(200).json({ status: 'success', message: 'Period deleted' });
  } catch (error: any) {
    logger.error('Error deleting accounting period:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to delete accounting period' });
  }
};
