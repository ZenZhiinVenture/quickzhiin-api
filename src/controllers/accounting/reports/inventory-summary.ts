import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../services/prisma/prismaClient';
import logger from '../../../utils/logger';

export const getInventorySummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isInventory: true,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        quantityOnHand: true,
        purchasePrice: true,
        salePrice: true,
      }
    });

    let totalAssetValue = 0;

    const items = products.map(product => {
      const quantity = Number(product.quantityOnHand || 0);
      const cost = Number(product.purchasePrice || 0);
      const value = quantity * cost;
      totalAssetValue += value;

      return {
        id: product.id.toString(),
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        quantityOnHand: quantity,
        purchasePrice: cost,
        salePrice: Number(product.salePrice || 0),
        inventoryValue: value
      };
    });

    return res.status(200).json({
      status: 'success',
      data: {
        items,
        totalAssetValue
      }
    });
  } catch (error: any) {
    logger.error('Error generating Inventory Summary report:', error);
    return res.status(500).json({ message: error.message || 'Failed to generate report' });
  }
};
