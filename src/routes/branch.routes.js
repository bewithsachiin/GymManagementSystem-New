import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { createBranch, listMyBranches } from '../controller/branch.controller.js';

const router = Router();

// only ADMIN
router.post(
  '/',
  authenticate,
  authorizeRoles('ADMIN'),
  createBranch
);

router.get(
  '/',
  authenticate,
  authorizeRoles('ADMIN'),
  listMyBranches
);

export default router;
