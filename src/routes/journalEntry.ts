import { Router } from 'express';
import * as journalEntryController from '../controllers/transaction/journalEntry';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken as any);

router.get('/', journalEntryController.listJournalEntries as any);
router.post('/', journalEntryController.createJournalEntry as any);

export default router;
