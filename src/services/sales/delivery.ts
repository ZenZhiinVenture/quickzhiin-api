import { prisma } from '../prisma/prismaClient';
import { TransactionStatusType, TransactionType } from '@prisma/client';
import { stockService } from '../inventory/stock';

export interface DeliveryLineInput {
  salesOrderLineId?: bigint;
  productId: bigint;
  productName: string;
  quantity: number;
  warehouseId: bigint;
}

export interface DeliveryOrderInput {
  salesOrderId?: bigint;
  customerId: bigint;
  date: Date;
  carrier?: string;
  trackingNumber?: string;
  notes?: string;
  shippingAddress?: string;
  lines: DeliveryLineInput[];
}

export const deliveryOrderService = {
  /**
   * Create and post a Delivery Order.
   * This automatically reduces stock in the specified warehouses.
   */
  async createAndPost(data: DeliveryOrderInput, createdBy: bigint) {
    // 1. Generate DO Number
    const lastDO = await prisma.deliveryOrder.findFirst({
      orderBy: { id: 'desc' },
      select: { number: true },
    });
    const nextNumber = lastDO ? (parseInt(lastDO.number.replace('DO-', ''), 10) + 1).toString().padStart(6, '0') : '000001';
    const doNumber = `DO-${nextNumber}`;

    // 2. Process in a transaction
    return await prisma.$transaction(async (tx) => {
      // 2a. Create the Delivery Order
      const deliveryOrder = await tx.deliveryOrder.create({
        data: {
          number: doNumber,
          date: data.date,
          salesOrderId: data.salesOrderId,
          contactId: data.customerId,
          carrier: data.carrier,
          trackingNumber: data.trackingNumber,
          notes: data.notes,
          shippingAddress: data.shippingAddress,
          status: TransactionStatusType.READY, // READY means it's posted and stock is moved
          createdBy,
          updatedBy: createdBy,
          deliveryLines: {
            create: data.lines.map((l) => ({
              salesOrderLineId: l.salesOrderLineId,
              productId: l.productId,
              productName: l.productName,
              quantity: l.quantity,
              warehouseId: l.warehouseId,
            })),
          },
        },
      });

      // 2b. Reduce Stock and update Sales Order line "deliveredQuantity"
      for (const line of data.lines) {
        // Record movement (reduce stock)
        await stockService.reduceStock(
          line.productId,
          line.warehouseId,
          line.quantity,
          TransactionType.SALE_DELIVERY_ORDER,
          deliveryOrder.id
        );

        // Update Sales Order Line if applicable
        if (line.salesOrderLineId) {
          await tx.salesOrderLine.update({
            where: { id: line.salesOrderLineId },
            data: {
              deliveredQuantity: { increment: line.quantity },
            },
          });
        }
      }

      // 2c. Check if Sales Order is fully delivered
      if (data.salesOrderId) {
        const remainingLines = await tx.salesOrderLine.findMany({
          where: { salesOrderId: data.salesOrderId },
        });
        const isFullyDelivered = remainingLines.every(l => l.quantity.lte(l.deliveredQuantity));

        if (isFullyDelivered) {
          await tx.salesOrder.update({
            where: { id: data.salesOrderId },
            data: { status: TransactionStatusType.READY },
          });
        }
      }

      return deliveryOrder;
    });
  },
};
