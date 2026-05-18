import { Request, Response, NextFunction } from 'express';
import { salesOrderService } from '../../services/sales/order';
import { deliveryOrderService } from '../../services/sales/delivery';
import logger from '../../utils/logger';

// --- Sales Order Controllers ---

export const createSalesOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const order = await salesOrderService.create(req.body, BigInt(userId));
    res.status(201).json({ status: 'success', data: order });
  } catch (error) {
    logger.error('Error creating sales order:', error);
    next(error);
  }
};

export const getSalesOrderList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await salesOrderService.list();
    res.status(200).json({ status: 'success', data: { items: orders } });
  } catch (error) {
    next(error);
  }
};

export const getSalesOrderDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await salesOrderService.getDetails(BigInt(req.params.id));
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    return next(error);
  }
};

// --- Delivery Order Controllers ---

export const createDeliveryOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const delivery = await deliveryOrderService.createAndPost(req.body, BigInt(userId));
    res.status(201).json({ status: 'success', data: delivery });
  } catch (error) {
    logger.error('Error creating delivery order:', error);
    next(error);
  }
};
