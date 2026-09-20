import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { getProfitAndLoss, getBalanceSheet, getGeneralLedger, getTrialBalance } from '../controllers/account/report';
import { getAgedReceivables } from '../controllers/accounting/reports/aged-receivables';
import { getAgedPayables } from '../controllers/accounting/reports/aged-payables';

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

export default router;
