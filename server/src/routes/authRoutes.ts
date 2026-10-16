import { Router } from 'express';
import {register, login, verifyEmail, resendCode, getProfile} from '../controllers/authController';
import {authenticate} from "../middlewares/authMiddleware";

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-code', resendCode);
router.get('/me', authenticate, getProfile);

export default router;
