import { Router } from 'express';
import { register, login, forgotPassword, resetPassword, verifyJWT } from '../controllers/auth';
import { validate } from '../utils/validate';
import { registerSchema, loginSchema } from '../schemas/auth';

const router = Router();

// POST /api/auth/register - User Registration
router.post('/register', validate(registerSchema), register);

// POST /api/auth/login - User Login
router.post('/login', validate(loginSchema), login);

router.post('/forgotpassword', forgotPassword);

router.post('/resetpassword', resetPassword);

router.get('/verify', verifyJWT);

export default router;
