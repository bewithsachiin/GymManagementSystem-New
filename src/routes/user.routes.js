
import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import {
  createStaff,
  createMember,
  listStaff,
  listMembers
} from './user.controller.js';

const router = Router();

// only ADMIN
router.post(
  '/staff',
  authenticate,
  authorizeRoles('ADMIN'),
  createStaff
);

router.get(
  '/staff',
  authenticate,
  authorizeRoles('ADMIN'),
  listStaff
);

router.post(
  '/members',
  authenticate,
  authorizeRoles('ADMIN'),
  createMember
);

router.get(
  '/members',
  authenticate,
  authorizeRoles('ADMIN'),
  listMembers
);

export default router;
