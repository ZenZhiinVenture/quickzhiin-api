import { Request, Response, NextFunction } from 'express';
import { salesQuoteService } from '../../services/sales/quote';
import { prisma } from '../../prisma/prismaClient';
import { TransactionStatusType } from '@prisma/client';
import logger from '../../utils/logger';

export const createSalesQuote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const quote = await salesQuoteService.create(req.body, BigInt(userId));
    res.status(201).json({ status: 'success', data: quote });
  } catch (error) {
    logger.error('Error creating sales quote:', error);
    next(error);
  }
};

export const getSalesQuoteList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quotes = await salesQuoteService.list();
    res.status(200).json({ status: 'success', data: { items: quotes } });
  } catch (error) {
    next(error);
  }
};

export const getSalesQuoteDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quote = await salesQuoteService.getDetails(BigInt(req.params.id));
    if (!quote) return res.status(404).json({ message: 'Quote not found' });
    return res.status(200).json({ status: 'success', data: quote });
  } catch (error) {
    return next(error);
  }
};

export const acceptSalesQuote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { target } = req.query; // 'ORDER' or 'INVOICE'

    let result;
    if (target === 'INVOICE') {
      result = await salesQuoteService.convertToInvoice(BigInt(req.params.id), BigInt(userId));
    } else {
      result = await salesQuoteService.convertToOrder(BigInt(req.params.id), BigInt(userId));
    }

    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    logger.error('Error accepting sales quote:', error);
    next(error);
  }
};

export const updateSalesQuote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const userId = (req as any).user.id;
    const updated = await prisma.salesQuote.update({
      where: { id },
      data: { ...req.body, updatedBy: BigInt(userId) }
    });
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    logger.error('Error updating sales quote:', error);
    next(error);
  }
};

export const patchSalesQuoteStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const userId = (req as any).user.id;
    const { status } = req.body as { status: TransactionStatusType };
    const updated = await prisma.salesQuote.update({
      where: { id },
      data: { status, updatedBy: BigInt(userId) }
    });
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    logger.error('Error patching sales quote status:', error);
    next(error);
  }
};

export const deleteSalesQuote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const userId = (req as any).user.id;
    await prisma.salesQuote.update({
      where: { id },
      data: { isActive: false, updatedBy: BigInt(userId) }
    });
    res.status(200).json({ status: 'success', data: { message: 'Sales quote deleted successfully' } });
  } catch (error) {
    logger.error('Error deleting sales quote:', error);
    next(error);
  }
};
