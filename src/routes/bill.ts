import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import {
  createBillTransaction,
  getBillTransactionList,
  getBillTransaction,
  updateBillTransaction,
  deleteBill,
} from '../controllers/transaction/bill';

const router = Router();

router.use(authenticateToken);

// GET /api/bill - Get all bills
router.get('/', getBillTransactionList);

// GET /api/bill/:id - Get a single bill details
router.get('/:id', getBillTransaction);

// POST /api/bill - Create a new bill
router.post('/', createBillTransaction);

// PUT /api/bill/:id - Update a bill
router.put('/:id', updateBillTransaction);

// DELETE /api/bill/:id - Delete a bill
router.delete('/:id', deleteBill);

export default router;
