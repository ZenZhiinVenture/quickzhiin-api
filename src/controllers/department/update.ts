import { Request, Response, NextFunction } from 'express';
import upsertDepartment from 'src/services/department/upsert';
import { prisma } from '../../services/prisma/prismaClient';

export default async function updateDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 1;

    const data = await upsertDepartment(userId, Number(id), req.body.department);

    return res.status(200).json({
      message: 'Department update successfully.',
      department: data,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
