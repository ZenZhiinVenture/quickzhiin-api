import { Router } from 'express';
import { validate } from '../utils/validate';
import { createAssetSchema, updateAssetSchema } from '../schemas/asset/asset';
import {
  getAssetDetails,
  getAssetList,
  createAsset,
  updateAsset,
  deleteAsset,
} from '../controllers/asset';

import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getAssetList);

router.get('/:id', getAssetDetails);

router.post('/', validate(createAssetSchema), createAsset);

router.put('/:id', validate(updateAssetSchema), updateAsset);

router.delete('/:id', deleteAsset);

export default router;
