import express from "express";
import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";
import {
  listMembers,
  createMember,
  getMemberById,
  updateMember,
  deleteMember,
  renewPlan
} from "../controller/member.controller.js";

import { allowBranchAccess } from "../middleware/branchAccessControl.middleware.js";

const router = Router();

router.get("/:branchId/members", authenticate, allowBranchAccess, listMembers);

router.post("/:branchId/members", authenticate, authorizeRoles("ADMIN"), allowBranchAccess, createMember);

router.get("/:branchId/members/:memberId", authenticate, allowBranchAccess, getMemberById);

router.put("/:branchId/members/:memberId", authenticate, authorizeRoles("ADMIN"), allowBranchAccess, updateMember);

router.delete("/:branchId/members/:memberId", authenticate, authorizeRoles("ADMIN"), allowBranchAccess, deleteMember);

router.post("/:branchId/members/:memberId/renew", authenticate, authorizeRoles("ADMIN"), allowBranchAccess, renewPlan);

export default router;

