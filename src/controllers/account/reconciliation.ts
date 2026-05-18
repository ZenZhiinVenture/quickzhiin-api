import { Request, Response, NextFunction } from 'express';
import { 
  getUnmatchedBankTransactions, 
  getUnmatchedLedgerTransactions, 
  matchBankToLedger, 
  unmatchBankTransaction,
  createAdjustmentAndMatch 
} from '../../services/bankAccount/reconciliation';
import { bankAdjustmentSchema } from '../../schemas/bankReconciliation';

export async function listUnreconciled(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const bankTransactions = await getUnmatchedBankTransactions(Number(id));
    const ledgerTransactions = await getUnmatchedLedgerTransactions(Number(id));
    
    return res.status(200).json({ 
      success: true, 
      data: { 
        bankTransactions, 
        ledgerTransactions 
      } 
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
    return next(err);
  }
}

export async function matchBankTransaction(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = Number((req as any).user.id);
    const data = await matchBankToLedger(req.body, userId);
    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
    return next(err);
  }
}

export async function unmatchBank(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = await unmatchBankTransaction(Number(id));
    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
    return next(err);
  }
}

export async function postAdjustment(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = Number((req as any).user.id);
    const validateData = bankAdjustmentSchema.parse(req.body);
    const data = await createAdjustmentAndMatch(validateData, userId);
    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
    return next(err);
  }
}
