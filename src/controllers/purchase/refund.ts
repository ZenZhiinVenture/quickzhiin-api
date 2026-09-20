import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/prismaClient';
import logger from '../../utils/logger';

export const createPurchaseRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const refund = await prisma.billRefund.create({
      data: { ...req.body, createdBy: BigInt(userId) },
      include: { bill: { include: { contact: true } } }
    });
    res.status(201).json({ status: 'success', data: refund });
  } catch (error) {
    logger.error('Error creating purchase refund:', error);
    next(error);
  }
};

export const getPurchaseRefundList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.billRefund.findMany({
      include: { bill: { include: { contact: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ status: 'success', data: { items } });
  } catch (error) {
    next(error);
  }
};

export const getPurchaseRefundDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const refund = await prisma.billRefund.findUnique({
      where: { id },
      include: { bill: { include: { contact: true } }, method: true }
    });
    if (!refund) return res.status(404).json({ message: 'Refund not found' });
    return res.status(200).json({ status: 'success', data: refund });
  } catch (error) {
    return next(error);
  }
};

export const updatePurchaseRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const userId = (req as any).user.id;
    const updated = await prisma.billRefund.update({
      where: { id },
      data: { ...req.body, updatedBy: BigInt(userId) },
      include: { bill: { include: { contact: true } } }
    });
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    logger.error('Error updating purchase refund:', error);
    next(error);
  }
};

export const deletePurchaseRefund = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.billRefund.delete({ where: { id } });
    res.status(200).json({ status: 'success', data: { message: 'Purchase refund deleted successfully' } });
  } catch (error) {
    logger.error('Error deleting purchase refund:', error);
    next(error);
  }
};
