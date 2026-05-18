import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';

export default async function readAccount(req: Request, res: Response, _next: NextFunction) {
  try {
    const { id } = req.params;

    const data = await prisma.account.findUnique({
      where: {
        id: BigInt(id),
      },
    });

    if (!data) {
      return res.status(404).json({
        message: 'Account not found',
      });
    }

    return res.status(200).json({
      message: 'Account retrieved successfully',
      account: data,
    });
  } catch (err: any) {
    return res.status(500).json({
      message: err.message,
    });
  }
}
