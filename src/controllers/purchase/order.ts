import { Request, Response, NextFunction } from 'express';
import { purchaseRequisitionService } from '../../services/purchase/requisition';
import { purchaseOrderService } from '../../services/purchase/order';
import { goodsReceivedNoteService } from '../../services/purchase/grn';
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
