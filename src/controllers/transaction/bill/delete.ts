import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../services/prisma/prismaClient';
import { deleteBill as deleteBillService } from 'src/services/bill/delete';

export default async function deleteBill(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const billId = req.params.id;

    if (!billId) {
      return res.status(400).json({ message: 'Bill ID is required' });
    }

    const result = await deleteBillService(prisma, Number(billId));

    return res.status(200).json({
      message: result.message,
    });
  } catch (err: any) {
    res.status(500).json({
      message: err.message || 'Failed to delete bill',
    });
    return next(err);
  }
}
