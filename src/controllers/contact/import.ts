import { Request, Response } from 'express';
import { prisma } from '../../services/prisma/prismaClient';
import Papa from 'papaparse';
import logger from '../../utils/logger';

export const importContacts = async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    // Parse CSV from buffer
    const csvData = req.file.buffer.toString('utf-8');
    
    // Parse using papaparse
    const parsed = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      logger.error('CSV Parsing errors:', parsed.errors);
      return res.status(400).json({ status: 'error', message: 'Invalid CSV format', details: parsed.errors });
    }

    const rows: any[] = parsed.data;
    let successCount = 0;
    const errors: string[] = [];

    // Process rows in a transaction
    await prisma.$transaction(async (tx: any) => {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          if (!row.legalName) {
            errors.push(`Row ${i + 1}: legalName is required`);
            continue;
          }

          await tx.contact.create({
            data: {
              legalName: row.legalName,
              email: row.email || null,
              phone: row.phone || null,
              isCustomer: row.isCustomer === 'true' || row.isCustomer === '1' || row.isCustomer?.toLowerCase() === 'yes',
              isSupplier: row.isSupplier === 'true' || row.isSupplier === '1' || row.isSupplier?.toLowerCase() === 'yes',
            }
          });
          successCount++;
        } catch (err: any) {
          errors.push(`Row ${i + 1}: Failed to import - ${err.message}`);
        }
      }
    });

    return res.status(200).json({
      status: 'success',
      message: `Import complete. Imported ${successCount} contacts.`,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    logger.error('Error importing contacts:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error during import' });
  }
};
