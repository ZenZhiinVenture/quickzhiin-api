import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../services/prisma/prismaClient';
import { recordInvoicePayment, recordBillPayment } from 'src/services/payment/recordPayment';

/**
 * POST /api/payment/invoice/:id
 * Records a payment for an invoice
 */
export async function createInvoicePayment(req: Request, res: Response, next: NextFunction) {
  try {
    const invoiceId = req.params.id;
    const userId = req.user?.id || 1;

    const payment = await recordInvoicePayment(
      prisma,
      Number(invoiceId),
      req.body,
      BigInt(userId)
    );

    return res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
    return next(err);
  }
}

/**
 * POST /api/payment/bill/:id
 * Records a payment for a bill
 */
export async function createBillPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const billId = req.params.id;
    const userId = req.user?.id || 1;

    const payment = await recordBillPayment(
      prisma,
      Number(billId),
      req.body,
      BigInt(userId)
    );

    return res.status(201).json({
      success: true,
      data: payment,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
    return next(err);
  }
}
