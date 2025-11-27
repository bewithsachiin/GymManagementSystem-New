import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { createAdmin, listAdmins } from '../controller/superaAdmin.controller.js';

const router = Router();

// only SUPERADMIN
router.post(
  '/admins',
  authenticate,
  authorizeRoles('SUPERADMIN'),
  createAdmin
);

router.get(
  '/admins',
  authenticate,
  authorizeRoles('SUPERADMIN'),
  listAdmins
);

export default router;
