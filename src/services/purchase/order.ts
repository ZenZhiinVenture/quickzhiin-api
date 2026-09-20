import { prisma } from '../prisma/prismaClient';
import { TransactionStatusType } from '@prisma/client';

export interface PurchaseOrderLineInput {
  productId?: bigint;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
}

export interface PurchaseOrderInput {
  vendorId: bigint;
  currency: string;
  date: Date;
  notes?: string;
  terms?: string;
  requisitionId?: bigint;
  lines: PurchaseOrderLineInput[];
}

export const purchaseOrderService = {
  /**
   * Create a new purchase order.
   */
  async create(data: PurchaseOrderInput, createdBy: bigint) {
    // 1. Calculate totals
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;
    let total = 0;

    const lines = data.lines.map((line) => {
      const lineDiscount = line.discount || 0;
      const lineTax = line.tax || 0;
      const lineTotal = (line.unitPrice * line.quantity) - lineDiscount + lineTax;

      subtotal += line.unitPrice * line.quantity;
      totalTax += lineTax;
      totalDiscount += lineDiscount;
      total += lineTotal;

      return {
        productId: line.productId,
        productName: line.productName,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discount: lineDiscount,
        tax: lineTax,
        total: lineTotal,
      };
    });

    // 2. Generate PO Number
    const lastPO = await prisma.purchaseOrder.findFirst({
      orderBy: { id: 'desc' },
      select: { number: true },
    });
    const nextNumber = lastPO ? (parseInt(lastPO.number.replace('PO-', ''), 10) + 1).toString().padStart(6, '0') : '000001';
    const poNumber = `PO-${nextNumber}`;

    // 3. Create PO and Lines in a transaction
    return await prisma.$transaction(async (tx) => {
      // If converting from a requisition, update requisition status
      if (data.requisitionId) {
        await tx.purchaseRequisition.update({
          where: { id: data.requisitionId },
          data: { status: TransactionStatusType.READY },
        });
      }

      return await tx.purchaseOrder.create({
        data: {
          number: poNumber,
          date: data.date,
          contactId: data.vendorId,
          currency: data.currency,
          subtotal,
          tax: totalTax,
          discount: totalDiscount,
          total,
          notes: data.notes,
          terms: data.terms,
          requisitionId: data.requisitionId,
          status: TransactionStatusType.DRAFT,
          createdBy,
          updatedBy: createdBy,
          orderLines: {
            create: lines,
          },
        },
        include: {
          orderLines: true,
          contact: true,
        },
      });
    });
  },

  /**
   * List purchase orders.
   */
  async list() {
    return await prisma.purchaseOrder.findMany({
      orderBy: { date: 'desc' },
      include: {
        contact: true,
        orderLines: true
      }
    });
  }
};
