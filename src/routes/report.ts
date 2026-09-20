import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { getProfitAndLoss, getBalanceSheet, getGeneralLedger, getTrialBalance } from '../controllers/account/report';
import { getAgedReceivables } from '../controllers/accounting/reports/aged-receivables';
import { getAgedPayables } from '../controllers/accounting/reports/aged-payables';
import { getInventorySummary } from '../controllers/accounting/reports/inventory-summary';
import { getInventoryByLocation } from '../controllers/accounting/reports/inventory-by-location';
import { getInventoryDetail } from '../controllers/accounting/reports/inventory-detail';

const router = Router();

router.use(authenticateToken);

// GET /api/report/profit-and-loss
router.get('/profit-and-loss', getProfitAndLoss);

// GET /api/report/balance-sheet
router.get('/balance-sheet', getBalanceSheet);

// GET /api/report/general-ledger
router.get('/general-ledger', getGeneralLedger);

// GET /api/report/trial-balance
router.get('/trial-balance', getTrialBalance);

// GET /api/report/aged-receivables
router.get('/aged-receivables', getAgedReceivables);

// GET /api/report/aged-payables
router.get('/aged-payables', getAgedPayables);

// GET /api/report/inventory-summary
router.get('/inventory-summary', getInventorySummary);

// GET /api/report/inventory-by-location
router.get('/inventory-by-location', getInventoryByLocation);

// GET /api/report/inventory-detail
router.get('/inventory-detail', getInventoryDetail);

export default router;
