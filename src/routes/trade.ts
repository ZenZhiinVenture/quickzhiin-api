import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import {
  createSalesQuote,
  getSalesQuoteList,
  getSalesQuoteDetails,
  acceptSalesQuote,
  updateSalesQuote,
  patchSalesQuoteStatus,
  deleteSalesQuote
} from '../controllers/sales/quote';
import {
  createSalesOrder,
  getSalesOrderList,
  getSalesOrderDetails,
  createDeliveryOrder,
  getSalesActivityLogs,
  updateSalesOrder,
  patchSalesOrderStatus,
  deleteSalesOrder
} from '../controllers/sales/order';
import {
  createPurchaseRequisition,
  getPurchaseRequisitionList,
  createPurchaseOrder,
  getPurchaseOrderList,
  createGRN,
  getGRNList,
  updatePurchaseOrder,
  patchPurchaseOrderStatus,
  deletePurchaseOrder,
  updateGRN,
  patchGRNStatus,
  deleteGRN
} from '../controllers/purchase/order';
import {
  createWarehouse,
  getWarehouseList,
  getWarehouseDetails,
  adjustStock,
  getProductMovements
} from '../controllers/inventory/warehouse';
import * as salesCreditNoteController from '../controllers/sales/creditNote';
import * as salesRefundController from '../controllers/sales/refund';
import * as purchaseCreditNoteController from '../controllers/purchase/creditNote';
import * as purchaseRefundController from '../controllers/purchase/refund';

const router = Router();

router.use(authenticateToken);

// --- Sales Routes ---
router.get('/sales/quote', getSalesQuoteList);
router.get('/sales/quote/:id', getSalesQuoteDetails);
router.post('/sales/quote', createSalesQuote);
router.post('/sales/quote/:id/accept', acceptSalesQuote);
router.put('/sales/quote/:id', updateSalesQuote);
router.patch('/sales/quote/:id/status', patchSalesQuoteStatus);
router.delete('/sales/quote/:id', deleteSalesQuote);

router.get('/sales/order', getSalesOrderList);
router.get('/sales/order/:id', getSalesOrderDetails);
router.post('/sales/order', createSalesOrder);
router.put('/sales/order/:id', updateSalesOrder);
router.patch('/sales/order/:id/status', patchSalesOrderStatus);
router.delete('/sales/order/:id', deleteSalesOrder);

router.post('/sales/delivery', createDeliveryOrder);
router.get('/sales/activity', getSalesActivityLogs);

// Sales Credit Notes
router.post('/sales/credit-note', salesCreditNoteController.createSalesCreditNote);
router.get('/sales/credit-note', salesCreditNoteController.getSalesCreditNoteList);
router.get('/sales/credit-note/:id', salesCreditNoteController.getSalesCreditNoteDetails);
router.put('/sales/credit-note/:id', salesCreditNoteController.updateSalesCreditNote);
router.delete('/sales/credit-note/:id', salesCreditNoteController.deleteSalesCreditNote);

// Sales Refunds
router.post('/sales/refund', salesRefundController.createSalesRefund);
router.get('/sales/refund', salesRefundController.getSalesRefundList);
router.get('/sales/refund/:id', salesRefundController.getSalesRefundDetails);
router.put('/sales/refund/:id', salesRefundController.updateSalesRefund);
router.delete('/sales/refund/:id', salesRefundController.deleteSalesRefund);

// --- Purchase Routes ---
router.post('/purchase/requisition', createPurchaseRequisition);
router.get('/purchase/requisition', getPurchaseRequisitionList);
router.post('/purchase/order', createPurchaseOrder);
router.get('/purchase/order', getPurchaseOrderList);
router.put('/purchase/order/:id', updatePurchaseOrder);
router.patch('/purchase/order/:id/status', patchPurchaseOrderStatus);
router.delete('/purchase/order/:id', deletePurchaseOrder);

router.post('/purchase/grn', createGRN);
router.get('/purchase/grn', getGRNList);
router.put('/purchase/grn/:id', updateGRN);
router.patch('/purchase/grn/:id/status', patchGRNStatus);
router.delete('/purchase/grn/:id', deleteGRN);

// Purchase Credit Notes
router.post('/purchase/credit-note', purchaseCreditNoteController.createPurchaseCreditNote);
router.get('/purchase/credit-note', purchaseCreditNoteController.getPurchaseCreditNoteList);
router.get('/purchase/credit-note/:id', purchaseCreditNoteController.getPurchaseCreditNoteDetails);
router.put('/purchase/credit-note/:id', purchaseCreditNoteController.updatePurchaseCreditNote);
router.delete('/purchase/credit-note/:id', purchaseCreditNoteController.deletePurchaseCreditNote);

// Purchase Refunds
router.post('/purchase/refund', purchaseRefundController.createPurchaseRefund);
router.get('/purchase/refund', purchaseRefundController.getPurchaseRefundList);
router.get('/purchase/refund/:id', purchaseRefundController.getPurchaseRefundDetails);
router.put('/purchase/refund/:id', purchaseRefundController.updatePurchaseRefund);
router.delete('/purchase/refund/:id', purchaseRefundController.deletePurchaseRefund);

// --- Inventory Routes ---
router.get('/inventory/warehouse', getWarehouseList);
router.get('/inventory/warehouse/:id', getWarehouseDetails);
router.post('/inventory/warehouse', createWarehouse);

router.post('/inventory/adjust', adjustStock);
router.get('/inventory/product/:productId/movements', getProductMovements);

export default router;
