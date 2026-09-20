import { Request, Response, NextFunction } from 'express';
import { salesOrderService } from '../../services/sales/order';
import { deliveryOrderService } from '../../services/sales/delivery';
import { TransactionStatusType } from '@prisma/client';
import logger from '../../utils/logger';

// --- Sales Order Controllers ---
import { prisma } from '../../services/prisma/prismaClient';

export const getSalesActivityLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    const roleId = user.roleId;

    // Fetch the role to check if admin
    const role = await prisma.role.findUnique({ where: { id: BigInt(roleId) } });
    const isAdmin = role?.name === 'ADMIN';

    const logs = await prisma.auditTrail.findMany({
      where: {
        tableName: { in: ['sales_quotes', 'sales_orders', 'invoices', 'delivery_orders'] },
        ...(isAdmin ? {} : { userId: BigInt(userId) })
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.status(200).json({ status: 'success', data: { items: logs } });
  } catch (error) {
    next(error);
  }
};

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

export const updateSalesOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const userId = (req as any).user.id;
    const updated = await prisma.salesOrder.update({
      where: { id },
      data: { ...req.body, updatedBy: BigInt(userId) }
    });
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    logger.error('Error updating sales order:', error);
    next(error);
  }
};

export const patchSalesOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const userId = (req as any).user.id;
    const { status } = req.body as { status: TransactionStatusType };
    const updated = await prisma.salesOrder.update({
      where: { id },
      data: { status, updatedBy: BigInt(userId) }
    });
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    logger.error('Error patching sales order status:', error);
    next(error);
  }
};

export const deleteSalesOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const userId = (req as any).user.id;
    await prisma.salesOrder.update({
      where: { id },
      data: { isActive: false, updatedBy: BigInt(userId) }
    });
    res.status(200).json({ status: 'success', data: { message: 'Sales order deleted successfully' } });
  } catch (error) {
    logger.error('Error deleting sales order:', error);
    next(error);
  }
};
