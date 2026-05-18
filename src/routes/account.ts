import { Router } from 'express';
import * as accountController from '../controllers/account';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken as any);

router.get('/', accountController.listAccounts as any);
router.get('/report/ledger', accountController.getLedgerReport as any);
router.get('/report/profit-loss', accountController.getProfitLossReport as any);
router.get('/report/balance-sheet', accountController.getBalanceSheetReport as any);
router.post('/', accountController.createAccount as any);
router.get('/:id', accountController.readAccount as any);
router.put('/:id', accountController.updateAccount as any);
router.delete('/:id', accountController.deleteAccount as any);

export default router;
