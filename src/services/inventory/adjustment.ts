import { prisma } from '../prisma/prismaClient';
import { TransactionType } from '@prisma/client';
import { stockService } from './stock';

export interface StockAdjustmentInput {
  productId: bigint;
  warehouseId: bigint;
  quantity: number;
  type: 'INCREMENT' | 'DECREMENT' | 'SET';
  reason?: string;
}

export const stockAdjustmentService = {
  /**
   * Adjust stock levels manually.
   */
  async adjust(data: StockAdjustmentInput, createdBy: bigint) {
    return await prisma.$transaction(async (tx) => {
      // 1. Determine adjustment quantity
      let adjustmentDelta = 0;
      if (data.type === 'SET') {
        const current = await tx.warehouseInventory.findUnique({
          where: {
            warehouseId_productId: {
              warehouseId: data.warehouseId,
              productId: data.productId,
            },
          },
        });
        const currentQty = current ? Number(current.quantity) : 0;
        adjustmentDelta = data.quantity - currentQty;
      } else {
        adjustmentDelta = data.type === 'INCREMENT' ? data.quantity : -data.quantity;
      }

      if (adjustmentDelta === 0) return null;

      // 2. Record movement
      return await stockService.recordMovement({
        productId: data.productId,
        fromWarehouseId: adjustmentDelta < 0 ? data.warehouseId : null,
        toWarehouseId: adjustmentDelta > 0 ? data.warehouseId : null,
        quantity: Math.abs(adjustmentDelta),
        type: TransactionType.STOCK_ADJUSTMENT,
        notes: data.reason || 'Manual adjustment',
      });
    });
  },

  /**
   * Get stock history for a product.
   */
  async getMovementHistory(productId: bigint) {
    return await prisma.stockMovement.findMany({
      where: { productId },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
      },
      orderBy: { date: 'desc' },
    });
  },
};
