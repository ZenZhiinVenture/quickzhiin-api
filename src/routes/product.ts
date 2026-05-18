import { Router } from 'express';
import { authenticateToken } from 'src/middlewares/auth';
import {
  createProduct,
  getProduct,
  getProductList,
  updateProduct,
  deleteProduct,
} from 'src/controllers/product';
import createInvoice from 'src/controllers/transaction/invoice/create';

const router = Router();

// Apply authentication middleware to all product routes
router.use(authenticateToken);

// POST /api/products - Create a new product (Requires auth)
router.post('/', createProduct);

// GET /api/products - Get all products for the tenant (Requires auth)
router.get('/', getProductList);

// GET /api/products/:id - Get a single product by ID (Requires auth)
router.get('/:id', getProduct);

// PUT /api/products/:id - Update a product by ID (Requires auth)
router.put('/:id', updateProduct);

router.delete('/:id', deleteProduct);

router.post('/generate/invoice', createInvoice);

export default router;
