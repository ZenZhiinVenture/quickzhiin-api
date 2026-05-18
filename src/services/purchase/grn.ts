import { prisma } from '../prisma/prismaClient';
import { TransactionStatusType, TransactionType } from '@prisma/client';
import { stockService } from '../inventory/stock';

export interface GRNLineInput {
  purchaseOrderLineId?: bigint;
  productId: bigint;
  productName: string;
  quantity: number;
  warehouseId: bigint;
}

export interface GRNInput {
  purchaseOrderId?: bigint;
  vendorId: bigint;
  date: Date;
  notes?: string;
  lines: GRNLineInput[];
}

export const goodsReceivedNoteService = {
  /**
   * Create and post a Goods Received Note.
   * This automatically increases stock in the specified warehouses.
   */
  async createAndPost(data: GRNInput, createdBy: bigint) {
    // 1. Generate GRN Number
    const lastGRN = await prisma.goodsReceivedNote.findFirst({
      orderBy: { id: 'desc' },
      select: { number: true },
    });
    const nextNumber = lastGRN ? (parseInt(lastGRN.number.replace('GRN-', ''), 10) + 1).toString().padStart(6, '0') : '000001';
    const grnNumber = `GRN-${nextNumber}`;

    // 2. Process in a transaction
    return await prisma.$transaction(async (tx) => {
      // 2a. Create the GRN
      const grn = await tx.goodsReceivedNote.create({
        data: {
          number: grnNumber,
          date: data.date,
          purchaseOrderId: data.purchaseOrderId,
          contactId: data.vendorId,
          notes: data.notes,
          status: TransactionStatusType.READY, // READY means it's posted and stock is moved
          createdBy,
          updatedBy: createdBy,
          receiptLines: {
            create: data.lines.map((l) => ({
              purchaseOrderLineId: l.purchaseOrderLineId,
              productId: l.productId,
              productName: l.productName,
              quantity: l.quantity,
              warehouseId: l.warehouseId,
            })),
          },
        },
      });

      // 2b. Add Stock and update Purchase Order line "receivedQuantity"
      for (const line of data.lines) {
        // Record movement (add stock)
        await stockService.recordMovement({
          productId: line.productId,
          fromWarehouseId: null, // No 'from' warehouse
          toWarehouseId: line.warehouseId, // Incoming to 'to' warehouse
          quantity: line.quantity,
          type: TransactionType.PURCHASE_GOOD_RECEIVE,
          referenceId: grn.id,
        });

        // Update Purchase Order Line if applicable
        if (line.purchaseOrderLineId) {
          await tx.purchaseOrderLine.update({
            where: { id: line.purchaseOrderLineId },
            data: {
              receivedQuantity: { increment: line.quantity },
            },
          });
        }
      }

      // 2c. Check if Purchase Order is fully received
      if (data.purchaseOrderId) {
        const remainingLines = await tx.purchaseOrderLine.findMany({
          where: { purchaseOrderId: data.purchaseOrderId },
        });
        const isFullyReceived = remainingLines.every(l => Number(l.quantity) <= Number(l.receivedQuantity));

        if (isFullyReceived) {
          await tx.purchaseOrder.update({
            where: { id: data.purchaseOrderId },
            data: { status: TransactionStatusType.READY },
          });
        }
      }

      return grn;
    });
  },

  /**
   * List GRNs.
   */
  async list() {
    return await prisma.goodsReceivedNote.findMany({
      include: {
        contact: true,
        purchaseOrder: true,
      },
      orderBy: { date: 'desc' },
    });
  },

  /**
   * Get GRN details.
   */
  async getDetails(id: bigint) {
    return await prisma.goodsReceivedNote.findUnique({
      where: { id },
      include: {
        receiptLines: {
          include: {
            product: true,
            warehouse: true,
          },
        },
        contact: true,
        purchaseOrder: true,
      },
    });
  },
};
