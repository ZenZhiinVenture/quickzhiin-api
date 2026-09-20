import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../services/prisma/prismaClient';
import logger from '../../../utils/logger';

export const getInventoryByLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const warehouseInventory = await prisma.warehouseInventory.findMany({
      include: {
        warehouse: {
          select: { id: true, name: true, code: true, location: true }
        },
        product: {
          select: { id: true, name: true, sku: true, purchasePrice: true }
        }
      }
    });

    const items = warehouseInventory.map(item => {
      const quantity = Number(item.quantity || 0);
      const cost = Number(item.product.purchasePrice || 0);
      return {
        id: item.id.toString(),
        warehouseId: item.warehouseId.toString(),
        warehouseName: item.warehouse.name,
        warehouseCode: item.warehouse.code,
        location: item.warehouse.location,
        productId: item.productId.toString(),
        productName: item.product.name,
        sku: item.product.sku,
        quantity,
        inventoryValue: quantity * cost
      };
    });

    return res.status(200).json({
      status: 'success',
      data: items
    });
  } catch (error: any) {
    logger.error('Error generating Inventory By Location report:', error);
    return res.status(500).json({ message: error.message || 'Failed to generate report' });
  }
};
