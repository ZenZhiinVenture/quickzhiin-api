import { Request, Response, NextFunction } from 'express';
import { upsertBill } from '../../../services/bill/upsert';

/**
 * Create a new bill from a request
 */
export default async function createBillTransaction(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = Number((req as any).user?.id) || 1;
    const billData = req.body;

    const createdBill = await upsertBill(
      {
        ...billData,
        date: new Date(billData.date),
        dueDate: billData.dueDate ? new Date(billData.dueDate) : undefined,
      },
      userId
    );

    return res.status(201).json({
      status: 'success',
      message: 'Bill created and posted to ledger successfully',
      data: createdBill,
    });
  } catch (err: any) {
    res.status(500).json({
      message: err.message || 'Error creating bill transaction',
    });
    return next(err);
  }
}
