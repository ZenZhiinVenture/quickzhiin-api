import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../services/prisma/prismaClient';

export default async function getDepartmentDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const data = await prisma.department.findUnique({
      where: {
        id: Number(id),
      },
    });
    return res.status(200).json({
      message: 'Read Department Detail Successfully',
      department: data,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
