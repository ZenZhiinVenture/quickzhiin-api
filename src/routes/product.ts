import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth';
import {
  createProduct,
  getProduct,
  getProductList,
  updateProduct,
  deleteProduct,
} from '../controllers/product';
import { importProducts } from '../controllers/product/import';
import createInvoice from '../controllers/transaction/invoice/create';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken);

router.post('/import', upload.single('file'), importProducts);

router.post('/', createProduct);
router.get('/', getProductList);
router.get('/:id', getProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.post('/generate/invoice', createInvoice);

export default router;
