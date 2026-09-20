import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import {
  createInvoice,
  getInvoiceList,
  getInvoiceDetails,
  updateInvoice,
  deleteInvoice,
  getInvoicePdf,
  sendInvoiceEmail,
  batchOperations,
} from '../controllers/transaction/invoice';

const router = Router();

router.use(authenticateToken);

// GET /api/invoice - Get all invoices
router.get('/', getInvoiceList);

// GET /api/invoice/:id - Get a single invoice details
router.get('/:id', getInvoiceDetails);

// GET /api/invoice/:id/pdf - Generate PDF for invoice
router.get('/:id/pdf', getInvoicePdf);

// POST /api/invoice - Create a new invoice
router.post('/', createInvoice);

// POST /api/invoice/:id/send - Send invoice email
router.post('/:id/send', sendInvoiceEmail);

// POST /api/invoice/batch - Perform batch operations
router.post('/batch', batchOperations);

// PUT /api/invoice/:id - Update an invoice
router.put('/:id', updateInvoice);

// DELETE /api/invoice/:id - Delete an invoice
router.delete('/:id', deleteInvoice);

export default router;
