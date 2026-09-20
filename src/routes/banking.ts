import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import * as incomeController from '../controllers/banking/income';
import * as expenseController from '../controllers/banking/expense';
import * as transferController from '../controllers/banking/transfer';

const router = Router();
router.use(authenticateToken);

// Income
router.get('/income', incomeController.list);
router.get('/income/:id', incomeController.getById);
router.post('/income', incomeController.create);
router.put('/income/:id', incomeController.update);
router.patch('/income/:id/status', incomeController.patchStatus);
router.delete('/income/:id', incomeController.remove);

// Expense
router.get('/expense', expenseController.list);
router.get('/expense/:id', expenseController.getById);
router.post('/expense', expenseController.create);
router.put('/expense/:id', expenseController.update);
router.patch('/expense/:id/status', expenseController.patchStatus);
router.delete('/expense/:id', expenseController.remove);

// Transfer
router.get('/transfer', transferController.list);
router.get('/transfer/:id', transferController.getById);
router.post('/transfer', transferController.create);
router.put('/transfer/:id', transferController.update);
router.delete('/transfer/:id', transferController.remove);

export default router;
