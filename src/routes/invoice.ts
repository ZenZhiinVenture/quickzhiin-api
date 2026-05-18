import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import {
  createInvoice,
  getInvoiceList,
  getInvoiceDetails,
  updateInvoice,
  deleteInvoice,
} from '../controllers/transaction/invoice';

const router = Router();

router.use(authenticateToken);

// GET /api/invoice - Get all invoices
router.get('/', getInvoiceList);

// GET /api/invoice/:id - Get a single invoice details
router.get('/:id', getInvoiceDetails);

// POST /api/invoice - Create a new invoice
router.post('/', createInvoice);

// PUT /api/invoice/:id - Update an invoice
router.put('/:id', updateInvoice);

// DELETE /api/invoice/:id - Delete an invoice
router.delete('/:id', deleteInvoice);

export default router;
