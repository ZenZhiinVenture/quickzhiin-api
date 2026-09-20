import { Request, Response } from 'express';
import { prisma } from '../../services/prisma/prismaClient';
import Papa from 'papaparse';
import logger from '../../utils/logger';

export const importProducts = async (req: Request, res: Response): Promise<any> => {
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

    await prisma.$transaction(async (tx: any) => {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          if (!row.name || !row.sku) {
            errors.push(`Row ${i + 1}: name and sku are required`);
            continue;
          }

          await tx.product.create({
            data: {
              name: row.name,
              sku: row.sku,
              salePrice: row.salePrice ? parseFloat(row.salePrice) : 0,
              purchasePrice: row.purchasePrice ? parseFloat(row.purchasePrice) : 0,
              isInventory: row.isInventory === 'true' || row.isInventory === '1' || row.isInventory?.toLowerCase() === 'yes',
              isActive: true,
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
      message: `Import complete. Imported ${successCount} products.`,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    logger.error('Error importing products:', error);
    return res.status(500).json({ status: 'error', message: 'Internal server error during import' });
  }
};
