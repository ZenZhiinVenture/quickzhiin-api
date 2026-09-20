import { Request, Response, NextFunction } from 'express';
import { purchaseRequisitionService } from '../../services/purchase/requisition';
import { purchaseOrderService } from '../../services/purchase/order';
import { goodsReceivedNoteService } from '../../services/purchase/grn';
import { prisma } from '../../prisma/prismaClient';
import { TransactionStatusType } from '@prisma/client';
import logger from '../../utils/logger';

// --- Purchase Requisition Controllers ---

export const createPurchaseRequisition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const requisition = await purchaseRequisitionService.create(req.body, req.body.lines || [], BigInt(userId));
    res.status(201).json({ status: 'success', data: requisition });
  } catch (error) {
    logger.error('Error creating purchase requisition:', error);
    next(error);
  }
};

export const getPurchaseRequisitionList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requisitions = await purchaseRequisitionService.list();
    res.status(200).json({ status: 'success', data: { items: requisitions } });
  } catch (error) {
    next(error);
  }
};

// --- Purchase Order Controllers ---

export const createPurchaseOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const order = await purchaseOrderService.create(req.body, BigInt(userId));
    res.status(201).json({ status: 'success', data: order });
  } catch (error) {
    logger.error('Error creating purchase order:', error);
    next(error);
  }
};

export const getPurchaseOrderList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orders = await purchaseOrderService.list();
    res.status(200).json({ status: 'success', data: { items: orders } });
  } catch (error) {
    next(error);
  }
};

export const updatePurchaseOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const userId = (req as any).user.id;
    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { ...req.body, updatedBy: BigInt(userId) }
    });
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    logger.error('Error updating purchase order:', error);
    next(error);
  }
};

export const patchPurchaseOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const userId = (req as any).user.id;
    const { status } = req.body as { status: TransactionStatusType };
    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status, updatedBy: BigInt(userId) }
    });
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    logger.error('Error patching purchase order status:', error);
    next(error);
  }
};

export const deletePurchaseOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const userId = (req as any).user.id;
    await prisma.purchaseOrder.update({
      where: { id },
      data: { isActive: false, updatedBy: BigInt(userId) }
    });
    res.status(200).json({ status: 'success', data: { message: 'Purchase order deleted successfully' } });
  } catch (error) {
    logger.error('Error deleting purchase order:', error);
    next(error);
  }
};

// --- Goods Received Note Controllers ---

export const createGRN = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const grn = await goodsReceivedNoteService.createAndPost(req.body, BigInt(userId));
    res.status(201).json({ status: 'success', data: grn });
  } catch (error) {
    logger.error('Error creating Goods Received Note:', error);
    next(error);
  }
};

export const getGRNList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const grns = await goodsReceivedNoteService.list();
    res.status(200).json({ status: 'success', data: { items: grns } });
  } catch (error) {
    next(error);
  }
};

export const updateGRN = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const userId = (req as any).user.id;
    const updated = await prisma.goodsReceivedNote.update({
      where: { id },
      data: { ...req.body, updatedBy: BigInt(userId) }
    });
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    logger.error('Error updating GRN:', error);
    next(error);
  }
};

export const patchGRNStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const userId = (req as any).user.id;
    const { status } = req.body as { status: TransactionStatusType };
    const updated = await prisma.goodsReceivedNote.update({
      where: { id },
      data: { status, updatedBy: BigInt(userId) }
    });
    res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    logger.error('Error patching GRN status:', error);
    next(error);
  }
};

export const deleteGRN = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = BigInt(req.params.id);
    const userId = (req as any).user.id;
    await prisma.goodsReceivedNote.update({
      where: { id },
      data: { isActive: false, updatedBy: BigInt(userId) }
    });
    res.status(200).json({ status: 'success', data: { message: 'GRN deleted successfully' } });
  } catch (error) {
    logger.error('Error deleting GRN:', error);
    next(error);
  }
};
