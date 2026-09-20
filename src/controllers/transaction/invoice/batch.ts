import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../services/prisma/prismaClient';
import logger from '../../../utils/logger';

const batchOperations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action, ids, payload } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'A non-empty array of IDs is required' });
    }

    // Convert string IDs to BigInt if needed
    const bigIntIds = ids.map((id: string) => BigInt(id));

    let successCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    // --- BATCH DELETE ---
    if (action === 'delete') {
      for (const id of bigIntIds) {
        try {
          const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: { invoicePayments: true, invoiceCreditNote: true },
          });

          if (!invoice) {
            failedCount++;
            errors.push({ id: id.toString(), reason: 'Invoice not found' });
            continue;
          }

          // Validation (As per Option 2 logic discussed)
          if (invoice.status !== 'DRAFT') {
            failedCount++;
            errors.push({ id: id.toString(), reason: 'Cannot delete non-draft invoice' });
            continue;
          }

          if (invoice.invoicePayments.length > 0) {
            failedCount++;
            errors.push({ id: id.toString(), reason: 'Cannot delete invoice with linked payments' });
            continue;
          }

          // Use transaction to ensure safe deletion of relations
          await prisma.$transaction([
            prisma.invoiceLine.deleteMany({ where: { invoiceId: id } }),
            prisma.invoice.delete({ where: { id } }),
          ]);

          successCount++;
        } catch (error: any) {
          logger.error(`Failed to delete invoice ${id}:`, error);
          failedCount++;
          errors.push({ id: id.toString(), reason: 'System error during deletion' });
        }
      }

      return res.status(200).json({
        message: `Batch delete completed. ${successCount} successful, ${failedCount} failed.`,
        successCount,
        failedCount,
        errors,
      });
    }

    // --- BATCH UPDATE STATUS ---
    if (action === 'updateStatus') {
      if (!payload || !payload.status) {
        return res.status(400).json({ message: 'Payload with status is required for updateStatus action' });
      }

      try {
        const updateResult = await prisma.invoice.updateMany({
          where: { id: { in: bigIntIds } },
          data: { status: payload.status },
        });

        successCount = updateResult.count;

        return res.status(200).json({
          message: `Batch status update completed successfully.`,
          successCount,
          failedCount: 0,
          errors: [],
        });
      } catch (error: any) {
        logger.error(`Failed to batch update invoice status:`, error);
        return res.status(500).json({ message: 'Failed to execute batch update' });
      }
    }

    return res.status(400).json({ message: 'Invalid batch action. Supported: delete, updateStatus' });
  } catch (error: any) {
    logger.error('Error in batchOperations:', error);
    res.status(500).json({ message: error.message || 'Failed to process batch operations' });
  }
};
export default batchOperations;
