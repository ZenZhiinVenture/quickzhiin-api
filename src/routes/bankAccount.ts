import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { upload } from '../middlewares/upload';
import * as bankController from '../controllers/account/bank';
import * as statementController from '../controllers/account/bankStatement';
import * as reconController from '../controllers/account/reconciliation';

const router = Router();

router.use(authenticateToken as any);

router.get('/', bankController.listBankAccounts as any);
router.post('/', bankController.upsertBank as any);
router.get('/:id', bankController.getBankAccount as any);
router.put('/:id', bankController.upsertBank as any);

// Bank Statement Routes
router.post('/:bankAccountId/statements', upload.single('file'), statementController.uploadBankStatement as any);
router.get('/:bankAccountId/statements', statementController.listBankStatements as any);

// Reconciliation Routes
router.get('/:id/unreconciled', reconController.listUnreconciled as any);
router.post('/match', reconController.matchBankTransaction as any);
router.post('/adjustment', reconController.postAdjustment as any);
router.delete('/:id/unmatch', reconController.unmatchBank as any);

export default router;
