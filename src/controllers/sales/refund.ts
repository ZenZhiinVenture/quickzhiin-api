import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/prismaClient';
import logger from '../../utils/logger';

export const createSalesRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const refund = await prisma.invoiceRefund.create({
      data: { ...req.body, createdBy: BigInt(userId) },
      include: { invoice: { include: { contact: true } } }
    });
    res.status(201).json({ status: 'success', data: refund });
  } catch (error) {
    logger.error('Error creating sales refund:', error);
    next(error);
  }
};

export const getSalesRefundList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.invoiceRefund.findMany({
      include: { invoice: { include: { contact: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ status: 'success', data: { items } });
  } catch (error) {
    next(error);
  }
};

export const getSalesRefundDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const refund = await prisma.invoiceRefund.findUnique({
      where: { id },
      include: { invoice: { include: { contact: true } }, method: true }
    });
    if (!refund) return res.status(404).json({ message: 'Refund not found' });
    return res.status(200).json({ status: 'success', data: refund });
  } catch (error) {
    return next(error);
  }
};

export const updateSalesRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const userId = (req as any).user.id;
    const updated = await prisma.invoiceRefund.update({
      where: { id },
      data: { ...req.body, updatedBy: BigInt(userId) },
      include: { invoice: { include: { contact: true } } }
    });
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    logger.error('Error updating sales refund:', error);
    next(error);
  }
};

export const deleteSalesRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.invoiceRefund.delete({ where: { id } });
    res.status(200).json({ status: 'success', data: { message: 'Sales refund deleted successfully' } });
  } catch (error) {
    logger.error('Error deleting sales refund:', error);
    next(error);
  }
};
