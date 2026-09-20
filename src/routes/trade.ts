import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import {
  createSalesQuote,
  getSalesQuoteList,
  getSalesQuoteDetails,
  acceptSalesQuote
} from '../controllers/sales/quote';
import {
  createSalesOrder,
  getSalesOrderList,
  getSalesOrderDetails,
  createDeliveryOrder,
  getSalesActivityLogs
} from '../controllers/sales/order';
import {
  createPurchaseRequisition,
  getPurchaseRequisitionList,
  createPurchaseOrder,
  getPurchaseOrderList,
  createGRN,
  getGRNList
} from '../controllers/purchase/order';
import {
  createWarehouse,
  getWarehouseList,
  getWarehouseDetails,
  adjustStock,
  getProductMovements
} from '../controllers/inventory/warehouse';

const router = Router();

router.use(authenticateToken);

// --- Sales Routes ---
router.get('/sales/quote', getSalesQuoteList);
router.get('/sales/quote/:id', getSalesQuoteDetails);
router.post('/sales/quote', createSalesQuote);

router.get('/sales/order', getSalesOrderList);
router.get('/sales/order/:id', getSalesOrderDetails);
router.post('/sales/order', createSalesOrder);

router.post('/sales/delivery', createDeliveryOrder);
router.get('/sales/activity', getSalesActivityLogs);

// --- Purchase Routes ---
router.post('/purchase/requisition', createPurchaseRequisition);
router.get('/purchase/requisition', getPurchaseRequisitionList);
router.post('/purchase/order', createPurchaseOrder);
router.get('/purchase/order', getPurchaseOrderList);
router.post('/purchase/grn', createGRN);
router.get('/purchase/grn', getGRNList);

// --- Inventory Routes ---
router.get('/inventory/warehouse', getWarehouseList);
router.get('/inventory/warehouse/:id', getWarehouseDetails);
router.post('/inventory/warehouse', createWarehouse);

router.post('/inventory/adjust', adjustStock);
router.get('/inventory/product/:productId/movements', getProductMovements);

export default router;
