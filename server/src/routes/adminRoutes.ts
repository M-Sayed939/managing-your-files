import { Router } from 'express';
import {deleteUser, getAdminStats, getAllUsers, updateUserRole} from '../controllers/adminController';
import { authenticate } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/adminMiddleware';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.patch('/users/:id', updateUserRole);
router.delete('/users/:id', deleteUser);

export default router;
