import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../../services/prisma/prismaClient';
import logger from '../../../utils/logger';

export const getInventoryDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;

    const queryParams: any = {};
    if (startDate && endDate) {
      queryParams.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const movements = await prisma.stockMovement.findMany({
      where: queryParams,
      orderBy: { date: 'asc' },
      include: {
        product: {
          select: { id: true, name: true, sku: true }
        },
        fromWarehouse: {
          select: { name: true }
        },
        toWarehouse: {
          select: { name: true }
        }
      }
    });

    const items = movements.map(m => {
      const quantity = Number(m.quantity);
      return {
        id: m.id.toString(),
        date: m.date.toISOString(),
        productId: m.productId.toString(),
        productName: m.product.name,
        sku: m.product.sku,
        type: m.type,
        quantity,
        fromWarehouse: m.fromWarehouse?.name,
        toWarehouse: m.toWarehouse?.name,
        referenceId: m.referenceId?.toString(),
        notes: m.notes
      };
    });

    return res.status(200).json({
      status: 'success',
      data: items
    });
  } catch (error: any) {
    logger.error('Error generating Inventory Detail report:', error);
    return res.status(500).json({ message: error.message || 'Failed to generate report' });
  }
};
