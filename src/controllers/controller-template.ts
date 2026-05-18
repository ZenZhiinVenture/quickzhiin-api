import { Request, Response, NextFunction } from 'express';
import { prisma } from '../services/prisma/prismaClient';

export default async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 1;

    void prisma; void userId; void id; // TODO: implement

    return res.status(200).json({
      message: '',
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
    return next(err);
  }
}
