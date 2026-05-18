import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../services/prisma/prismaClient';

export default async function listJournalEntries(req: Request, res: Response, _next: NextFunction) {
  try {

    const data = await prisma.journalEntry.findMany({
      where: {
        isActive: true,
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return res.status(200).json({
      message: 'Journal Entries retrieved successfully',
      journalEntries: data,
    });
  } catch (err: any) {
    return res.status(500).json({
      message: err.message,
    });
  }
}
