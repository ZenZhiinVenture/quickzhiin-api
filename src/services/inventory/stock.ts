import { prisma } from '../prisma/prismaClient';
import { TransactionType } from '@prisma/client';

export const stockService = {
  /**
   * Record a stock movement and update warehouse balance.
   */
  async recordMovement(data: {
    productId: bigint;
    fromWarehouseId?: bigint | null;
    toWarehouseId?: bigint | null;
    type: TransactionType;
    quantity: number;
    referenceId?: bigint | null;
    notes?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      // 1. Record the movement audit trail
      const movement = await tx.stockMovement.create({
        data: {
          productId: data.productId,
          fromWarehouseId: data.fromWarehouseId,
          toWarehouseId: data.toWarehouseId,
          type: data.type,
          quantity: data.quantity,
          referenceId: data.referenceId,
          notes: data.notes,
        },
      });

      // 2. Adjust 'From' warehouse balance (if applicable)
      if (data.fromWarehouseId) {
        await this.updateBalance(tx, data.productId, data.fromWarehouseId, -data.quantity);
      }

      // 3. Adjust 'To' warehouse balance (if applicable)
      if (data.toWarehouseId) {
        await this.updateBalance(tx, data.productId, data.toWarehouseId, data.quantity);
      }

      // 4. Update the aggregate Product 'quantityOnHand'
      const totalStock = await tx.warehouseInventory.aggregate({
        where: { productId: data.productId },
        _sum: { quantity: true },
      });

      await tx.product.update({
        where: { id: data.productId },
        data: { quantityOnHand: totalStock._sum.quantity || 0 },
      });

      return movement;
    });
  },

  /**
   * Internal helper to update or create warehouse inventory records.
   */
  async updateBalance(tx: any, productId: bigint, warehouseId: bigint, delta: number) {
    const existing = await tx.warehouseInventory.findUnique({
      where: {
        warehouseId_productId: {
          warehouseId,
          productId,
        },
      },
    });

    if (existing) {
      await tx.warehouseInventory.update({
        where: { id: existing.id },
        data: { quantity: { increment: delta } },
      });
    } else {
      await tx.warehouseInventory.create({
        data: {
          productId,
          warehouseId,
          quantity: delta,
        },
      });
    }
  },

  /**
   * Convenience method to add stock (e.g., from GRN or Purchase).
   */
  async addStock(productId: bigint, warehouseId: bigint, quantity: number, type: TransactionType, referenceId: bigint) {
    return this.recordMovement({
      productId,
      toWarehouseId: warehouseId,
      type,
      quantity,
      referenceId,
    });
  },

  /**
   * Convenience method to reduce stock (e.g., from Delivery Note or Sales Order).
   */
  async reduceStock(productId: bigint, warehouseId: bigint, quantity: number, type: TransactionType, referenceId: bigint) {
    return this.recordMovement({
      productId,
      fromWarehouseId: warehouseId,
      type,
      quantity,
      referenceId,
    });
  },
};
