import { Router } from 'express';
import { debugRegister, login } from '../controller/auth.controller.js';

const router = Router();

// only for testing / dev
router.post('/debug-register', debugRegister);

// main login
router.post('/login', login);

export default router;
