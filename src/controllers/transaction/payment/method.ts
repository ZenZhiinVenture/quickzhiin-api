import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../services/prisma/prismaClient';

/**
 * GET /api/payment/methods
 * Returns a list of available payment methods
 */
export async function getPaymentMethods(req: Request, res: Response, next: NextFunction) {
  try {

    const methods = await prisma.paymentMethod.findMany({
      where: { isActive: true },
      include: { account: true },
    });

    return res.status(200).json({
      success: true,
      data: methods,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
    return next(err);
  }
}
