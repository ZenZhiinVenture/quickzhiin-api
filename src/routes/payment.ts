import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import { createInvoicePayment, createBillPayment } from '../controllers/transaction/payment/create';
import { getPaymentMethods } from '../controllers/transaction/payment/method';

const router = Router();

router.use(authenticateToken);

// POST /api/payment/invoice/:id - Record a payment for an invoice
router.post('/invoice/:id', createInvoicePayment);

// POST /api/payment/bill/:id - Record a payment for a bill
router.post('/bill/:id', createBillPayment);

// GET /api/payment/methods - Get all payment methods
router.get('/methods', getPaymentMethods);

export default router;
