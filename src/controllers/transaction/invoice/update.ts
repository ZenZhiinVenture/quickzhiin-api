import { Request, Response, NextFunction } from 'express';

export default async function updateInvoice(req: Request, res: Response, next: NextFunction) {
  try {


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
