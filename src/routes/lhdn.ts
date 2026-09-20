import { Router } from 'express';
import { submitLhdnInvoice, getLhdnInvoiceStatus } from '../controllers/lhdn/einvoice';

const router = Router();

// Submit an invoice to LHDN
router.post('/submit/:id', submitLhdnInvoice);

// Poll/Check the status of an LHDN invoice
router.get('/status/:id', getLhdnInvoiceStatus);

export default router;
