import { Request, Response, NextFunction } from 'express';
import upsertJournalEntry from '../../../services/journalEntry/upsert';

export default async function createJournalEntry(req: Request, res: Response, _next: NextFunction) {
  try {
    const userId = (req as any).user?.id || 1;

    const data = await upsertJournalEntry(req.body, userId, undefined);

    return res.status(200).json({
      message: 'Journal Entry Created Successfully',
      journalEntry: data,
    });
  } catch (err: any) {
    return res.status(500).json({
      message: err.message,
    });
  }
}
