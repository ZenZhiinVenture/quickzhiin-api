import { Request, Response, NextFunction } from 'express';
import { upsertInvoice } from '../../../services/invoice/upsert';
import logger from '../../../utils/logger';

export default async function createInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id;
    const invoice = await upsertInvoice(req.body, BigInt(userId));
    
    return res.status(201).json({
      status: 'success',
      message: 'Invoice created successfully',
      data: invoice
    });
  } catch (err: any) {
    logger.error('Error creating invoice:', err);
    return res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
