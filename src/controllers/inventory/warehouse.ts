import { Request, Response, NextFunction } from 'express';
import { warehouseService } from '../../services/inventory/warehouse';
import { stockAdjustmentService } from '../../services/inventory/adjustment';
import logger from '../../utils/logger';

// --- Warehouse Controllers ---

export const createWarehouse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const warehouse = await warehouseService.create({ ...req.body, createdBy: BigInt(userId) });
    res.status(201).json({ status: 'success', data: warehouse });
  } catch (error) {
    logger.error('Error creating warehouse:', error);
    next(error);
  }
};

export const getWarehouseList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const warehouses = await warehouseService.list();
    res.status(200).json({ status: 'success', data: { items: warehouses } });
  } catch (error) {
    next(error);
  }
};

export const getWarehouseDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const warehouse = await warehouseService.getDetails(BigInt(req.params.id));
    if (!warehouse) return res.status(404).json({ message: 'Warehouse not found' });
    return res.status(200).json({ status: 'success', data: warehouse });
  } catch (error) {
    return next(error);
  }
};

// --- Stock Adjustment Controllers ---

export const adjustStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const movement = await stockAdjustmentService.adjust(req.body, BigInt(userId));
    res.status(200).json({ status: 'success', data: movement });
  } catch (error) {
    logger.error('Error adjusting stock:', error);
    next(error);
  }
};

export const getProductMovements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const movements = await stockAdjustmentService.getMovementHistory(BigInt(req.params.productId));
    res.status(200).json({ status: 'success', data: { items: movements } });
  } catch (error) {
    next(error);
  }
};
