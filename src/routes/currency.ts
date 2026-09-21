import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import {
  getCurrencySettings,
  setBaseCurrency,
  listExchangeRates,
  createExchangeRate,
  deleteExchangeRate,
} from '../controllers/settings/currency';

const router = Router();

router.use(authenticateToken);

// GET /api/settings/currency — Get base currency, supported currencies & recent rates
router.get('/', getCurrencySettings);

// POST /api/settings/currency/base — Set company base currency
router.post('/base', setBaseCurrency);

// GET /api/settings/currency/rates — List all rates
router.get('/rates', listExchangeRates);

// POST /api/settings/currency/rates — Record new exchange rate
router.post('/rates', createExchangeRate);

// DELETE /api/settings/currency/rates/:id — Delete exchange rate
router.delete('/rates/:id', deleteExchangeRate);

export default router;
