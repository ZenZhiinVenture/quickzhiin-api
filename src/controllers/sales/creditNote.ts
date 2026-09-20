import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma/prismaClient';
import { TransactionStatusType } from '@prisma/client';
import logger from '../../utils/logger';

export const createSalesCreditNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const creditNote = await prisma.invoiceCreditNote.create({
      data: { ...req.body, createdBy: BigInt(userId) },
      include: { contact: true }
    });
    res.status(201).json({ status: 'success', data: creditNote });
  } catch (error) {
    logger.error('Error creating sales credit note:', error);
    next(error);
  }
};

export const getSalesCreditNoteList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.invoiceCreditNote.findMany({
      include: { contact: true },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ status: 'success', data: { items } });
  } catch (error) {
    next(error);
  }
};

export const getSalesCreditNoteDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const creditNote = await prisma.invoiceCreditNote.findUnique({
      where: { id },
      include: { contact: true, invoice: true, invoiceCreditNoteLine: true }
    });
    if (!creditNote) return res.status(404).json({ message: 'Credit note not found' });
    return res.status(200).json({ status: 'success', data: creditNote });
  } catch (error) {
    return next(error);
  }
};

export const updateSalesCreditNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const userId = (req as any).user.id;
    const updated = await prisma.invoiceCreditNote.update({
      where: { id },
      data: { ...req.body, updatedBy: BigInt(userId) },
      include: { contact: true }
    });
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    logger.error('Error updating sales credit note:', error);
    next(error);
  }
};

export const patchSalesCreditNoteStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const userId = (req as any).user.id;
    const { status } = req.body as { status: TransactionStatusType };
    const updated = await prisma.invoiceCreditNote.update({
      where: { id },
      data: { status, updatedBy: BigInt(userId) }
    });
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    logger.error('Error patching sales credit note status:', error);
    next(error);
  }
};

export const deleteSalesCreditNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.invoiceCreditNote.delete({ where: { id } });
    res.status(200).json({ status: 'success', data: { message: 'Sales credit note deleted successfully' } });
  } catch (error) {
    logger.error('Error deleting sales credit note:', error);
    next(error);
  }
};
