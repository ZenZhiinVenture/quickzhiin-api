import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';

export default async function listAccounts(req: Request, res: Response, _next: NextFunction) {
  try {

    const data = await prisma.account.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        code: 'asc',
      },
    });

    return res.status(200).json({
      message: 'Accounts retrieved successfully',
      accounts: data,
    });
  } catch (err: any) {
    return res.status(500).json({
      message: err.message,
    });
  }
}
