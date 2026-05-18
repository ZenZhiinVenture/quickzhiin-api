import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';

export default async function deleteAccount(req: Request, res: Response, _next: NextFunction) {
  try {
    const { id } = req.params;

    // Check if account is system-protected
    const account = await prisma.account.findUnique({
      where: { id: BigInt(id) },
    });

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (account.isSystem) {
      return res.status(403).json({ message: 'System accounts cannot be deleted' });
    }

    // Soft delete by setting isActive to false
    const data = await prisma.account.update({
      where: { id: BigInt(id) },
      data: { isActive: false },
    });

    return res.status(200).json({
      message: 'Account Deleted Successfully',
      account: data,
    });
  } catch (err: any) {
    return res.status(500).json({
      message: err.message,
    });
  }
}
