import { Router } from 'express';
import roleController from '../controllers/role';
import { authenticateToken } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/role';

const router = Router();

// Role management routes
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', roleController.getRoleList);
router.post('/', roleController.createRole);
router.get('/:id', roleController.readRole);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

export default router;
