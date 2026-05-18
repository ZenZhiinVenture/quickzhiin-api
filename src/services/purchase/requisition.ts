import { prisma } from '../prisma/prismaClient';
import { TransactionStatusType } from '@prisma/client';

export interface PurchaseRequisitionLineInput {
  productId?: bigint;
  productName: string;
  description?: string;
  quantity: number;
  estimatedUnitPrice?: number;
}

export interface PurchaseRequisitionInput {
  date: Date;
  priority?: string;
  departmentId?: bigint;
  notes?: string;
  requestedBy: bigint;
}

export const purchaseRequisitionService = {
  /**
   * Create a new purchase requisition.
   */
  async create(data: PurchaseRequisitionInput, lines: PurchaseRequisitionLineInput[], createdBy: bigint) {
    // 1. Generate PR Number
    const lastPR = await prisma.purchaseRequisition.findFirst({
      orderBy: { id: 'desc' },
      select: { number: true },
    });
    const nextNumber = lastPR ? (parseInt(lastPR.number.replace('PR-', ''), 10) + 1).toString().padStart(6, '0') : '000001';
    const prNumber = `PR-${nextNumber}`;

    // 2. Create PR and Lines in a transaction
    return await prisma.$transaction(async (tx) => {
      return await tx.purchaseRequisition.create({
        data: {
          number: prNumber,
          date: data.date,
          priority: data.priority || 'MEDIUM',
          departmentId: data.departmentId,
          notes: data.notes,
          requestedBy: data.requestedBy,
          status: TransactionStatusType.DRAFT,
          createdBy,
          updatedBy: createdBy,
          reqLines: {
            create: lines.map((l) => ({
              productId: l.productId,
              productName: l.productName,
              description: l.description,
              quantity: l.quantity,
              estimatedUnitPrice: l.estimatedUnitPrice || 0,
            })),
          },
        },
        include: {
          reqLines: true,
          requester: true,
        },
      });
    });
  },
};
