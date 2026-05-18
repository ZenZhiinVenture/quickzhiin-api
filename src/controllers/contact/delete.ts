import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';

export default async function deleteContact(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    await prisma.contact.delete({
      where: {
        id: Number(id),
      },
    });

    return res.status(200).json({
      message: 'Delete Contact Successfully.',
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
