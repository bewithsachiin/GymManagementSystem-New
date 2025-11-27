import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

router.get(
  '/dashboard',
  authenticate,
  authorizeRoles('SUPERADMIN', 'ADMIN'),
  (req, res) => {
    res.json({ message: 'Admin / SuperAdmin dashboard data', user: req.user });
  }
);

export default router;
