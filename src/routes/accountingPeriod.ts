import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { listPeriods, createPeriod, closePeriod, reopenPeriod, deletePeriod } from '../controllers/accounting/period';

const router = Router();

router.use(authenticateToken);

// GET /api/accounting/period — list all periods
router.get('/', listPeriods);

// POST /api/accounting/period — create a new period
router.post('/', createPeriod);

// PATCH /api/accounting/period/:id/close — lock a period
router.patch('/:id/close', closePeriod);

// PATCH /api/accounting/period/:id/reopen — unlock a period
router.patch('/:id/reopen', reopenPeriod);

// DELETE /api/accounting/period/:id — remove a period
router.delete('/:id', deletePeriod);

export default router;
