import { Request, Response, NextFunction } from 'express';
import upsertDepartment from 'src/services/department/upsert';
import { prisma } from '../../services/prisma/prismaClient';

export default async function createDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || 1;

    const data = await upsertDepartment(userId, undefined, req.body.department);

    return res.status(200).json({
      message: 'Create Succesfully',
      department: data,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
