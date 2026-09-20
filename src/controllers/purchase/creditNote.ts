import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';
import { TransactionStatusType } from '@prisma/client';
import logger from '../../utils/logger';

export const createPurchaseCreditNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const creditNote = await prisma.billCreditNote.create({
      data: { ...req.body, createdBy: BigInt(userId) },
      include: { contact: true }
    });
    res.status(201).json({ status: 'success', data: creditNote });
  } catch (error) {
    logger.error('Error creating purchase credit note:', error);
    next(error);
  }
};

export const getPurchaseCreditNoteList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.billCreditNote.findMany({
      include: { contact: true },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ status: 'success', data: { items } });
  } catch (error) {
    next(error);
  }
};

export const getPurchaseCreditNoteDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const creditNote = await prisma.billCreditNote.findUnique({
      where: { id },
      include: { contact: true, bill: true, creditNoteLines: true }
    });
    if (!creditNote) return res.status(404).json({ message: 'Credit note not found' });
    return res.status(200).json({ status: 'success', data: creditNote });
  } catch (error) {
    return next(error);
  }
};

export const updatePurchaseCreditNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const userId = (req as any).user.id;
    const updated = await prisma.billCreditNote.update({
      where: { id },
      data: { ...req.body, updatedBy: BigInt(userId) },
      include: { contact: true }
    });
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    logger.error('Error updating purchase credit note:', error);
    next(error);
  }
};

export const patchPurchaseCreditNoteStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const userId = (req as any).user.id;
    const { status } = req.body as { status: TransactionStatusType };
    const updated = await prisma.billCreditNote.update({
      where: { id },
      data: { status, updatedBy: BigInt(userId) }
    });
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    logger.error('Error patching purchase credit note status:', error);
    next(error);
  }
};

export const deletePurchaseCreditNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.billCreditNote.delete({ where: { id } });
    res.status(200).json({ status: 'success', data: { message: 'Purchase credit note deleted successfully' } });
  } catch (error) {
    logger.error('Error deleting purchase credit note:', error);
    next(error);
  }
};
