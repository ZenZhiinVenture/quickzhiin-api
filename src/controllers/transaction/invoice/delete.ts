import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../services/prisma/prismaClient';
import { deleteInvoice as deleteInvoiceService } from 'src/services/invoice/delete';

export default async function deleteInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const invoiceId = req.params.id;

    if (!invoiceId) {
      return res.status(400).json({ message: 'Invoice ID is required' });
    }

    const result = await deleteInvoiceService(prisma, Number(invoiceId));

    return res.status(200).json({
      message: result.message,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || 'Failed to delete invoice',
    });
    return next(err);
  }
}
