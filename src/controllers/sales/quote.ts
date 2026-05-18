import { Request, Response, NextFunction } from 'express';
import { salesQuoteService } from '../../services/sales/quote';
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
