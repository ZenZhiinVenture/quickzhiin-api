import { Request, Response, NextFunction } from 'express';
import { processBankStatement, getBankStatements } from '../../services/bankAccount/statement';

export async function uploadBankStatement(req: Request, res: Response, next: NextFunction) {
  try {
    const { bankAccountId } = req.params;
    const userId = Number((req as any).user.id);

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const result = await processBankStatement(
      Number(bankAccountId),
      fileContent,
      userId,
      req.file.originalname
    );

    return res.status(200).json({
      success: true,
      message: 'Bank statement processed successfully',
      data: result,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
    return next(err);
  }
}

export async function listBankStatements(req: Request, res: Response, next: NextFunction) {
  try {
    const { bankAccountId } = req.params;
    const data = await getBankStatements(Number(bankAccountId));
    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
    return next(err);
  }
}
