import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { getProfitAndLoss, getBalanceSheet, getGeneralLedger, getTrialBalance } from '../controllers/account/report';

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

export default router;
