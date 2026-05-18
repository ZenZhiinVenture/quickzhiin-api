import { Router } from 'express';
import userController from '../controllers/user';
import { authenticateToken } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/role';

const router = Router();

// All user management routes require authentication and admin access
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', userController.getUserList);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
