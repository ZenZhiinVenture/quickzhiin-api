import { Request, Response, NextFunction } from 'express';
import { getBankAccounts, getBankAccountById } from '../../services/bankAccount/query';
import { upsertBankAccount } from '../../services/bankAccount/upsert';

export async function listBankAccounts(req: Request, res: Response, next: NextFunction) {
    try {
        const data = await getBankAccounts();
        return res.status(200).json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
        return next(err);
    }
}

export async function getBankAccount(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const data = await getBankAccountById(Number(id));
        if (!data) return res.status(404).json({ success: false, message: 'Bank Account not found' });
        return res.status(200).json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
        return next(err);
    }
}

export async function upsertBank(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        const userId = Number((req as any).user.id);
        const data = await upsertBankAccount(req.body, userId, id ? Number(id) : undefined);
        return res.status(200).json({ success: true, data });
    } catch (err: any) {
        res.status(400).json({ success: false, message: err.message });
        return next(err);
    }
}
