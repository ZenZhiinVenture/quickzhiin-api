import { Router } from 'express';
import {
  listRecurringInvoices,
  getRecurringInvoice,
  createRecurringInvoice,
  updateRecurringInvoice,
  deleteRecurringInvoice,
  pauseRecurringInvoice,
  resumeRecurringInvoice,
  processRecurringBatch,
} from '../controllers/transaction/recurringInvoice';

const router = Router();

router.get('/', listRecurringInvoices);
router.post('/process', processRecurringBatch);
router.get('/:id', getRecurringInvoice);
router.post('/', createRecurringInvoice);
router.put('/:id', updateRecurringInvoice);
router.delete('/:id', deleteRecurringInvoice);
router.patch('/:id/pause', pauseRecurringInvoice);
router.patch('/:id/resume', resumeRecurringInvoice);

export default router;
