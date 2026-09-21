import { Router } from 'express';
import * as journalEntryController from '../controllers/transaction/journalEntry';
import { importJournalEntries } from '../controllers/transaction/journalEntry/import';
import { authenticateToken } from '../middlewares/auth';
import { guardClosedPeriod } from '../middlewares/closedPeriod';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken as any);

router.post('/import', upload.single('file'), importJournalEntries);
router.get('/', journalEntryController.listJournalEntries as any);
router.post('/', guardClosedPeriod, journalEntryController.createJournalEntry as any);

export default router;
