import { Router } from 'express';
import { login, changePassword } from '../controller/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/login', login);

router.post('/change-password', authenticate, changePassword);

export default router;
