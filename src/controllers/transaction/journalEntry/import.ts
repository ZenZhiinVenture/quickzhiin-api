import { Request, Response } from 'express';
import { prisma } from '../../../services/prisma/prismaClient';
import Papa from 'papaparse';
import logger from '../../../utils/logger';

export const importJournalEntries = async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    const csvData = req.file.buffer.toString('utf-8');
    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });

    if (parsed.errors.length > 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid CSV format', details: parsed.errors });
    }

    const rows: any[] = parsed.data;
    let successCount = 0;
    const errors: string[] = [];

    // Group rows by Reference Number to create multi-line journal entries
    const entriesByRef = rows.reduce((acc, row, idx) => {
      const ref = row.reference || row.referenceNumber || `ROW_${idx}`;
      if (!acc[ref]) acc[ref] = { rows: [], originalIndices: [] };
      acc[ref].rows.push(row);
      acc[ref].originalIndices.push(idx + 1);
      return acc;
    }, {} as Record<string, { rows: any[], originalIndices: number[] }>);

    await prisma.$transaction(async (tx: any) => {
      const entriesArray = Object.entries(entriesByRef) as [string, { rows: any[], originalIndices: number[] }][];
      for (const [ref, { rows: entryRows, originalIndices }] of entriesArray) {
        try {
          // Calculate total debits and credits
          let totalDebit = 0;
          let totalCredit = 0;
          const lines = [];

          const date = new Date(entryRows[0].date || Date.now());

          for (const row of entryRows) {
            if (!row.accountId) {
              throw new Error(`accountId is missing`);
            }
            const debit = parseFloat(row.debit) || 0;
            const credit = parseFloat(row.credit) || 0;
            
            totalDebit += debit;
            totalCredit += credit;

            lines.push({
              accountId: BigInt(row.accountId),
              description: row.description || '',
              debit,
              credit,
            });
          }

          if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(`Debit (${totalDebit}) and Credit (${totalCredit}) do not match`);
          }

          await tx.journalEntry.create({
            data: {
              referenceNumber: ref,
              date,
              description: entryRows[0].description || 'Imported Journal Entry',
              lines: {
                create: lines
              }
            }
          });
          successCount++;
        } catch (err: any) {
          errors.push(`Reference ${ref} (Rows ${originalIndices.join(',')}): ${err.message}`);
        }
      }
    });

    return res.status(200).json({
      status: 'success',
      message: `Import complete. Imported ${successCount} journal entries.`,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    logger.error('Error importing journal entries:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error during import' });
  }
};
