import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';

export default async function patchContactStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        message: 'isActive must be a boolean value',
      });
    }

    const updatedContact = await prisma.contact.update({
      where: { id: BigInt(id) },
      data: {
        isActive,
        updatedAt: new Date(),
        updatedBy: BigInt(req.user?.id || 1),
      },
    });

    return res.status(200).json({
      message: 'Contact status updated successfully',
      data: updatedContact,
    });
  } catch (error) {
    return next(error);
  }
}
