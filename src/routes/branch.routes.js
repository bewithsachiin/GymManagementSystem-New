import { Router } from "express";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware.js";

import {
  createBranch,
  listMyBranches,
  getBranchById,
  updateBranch,
  deleteBranch
} from "../controller/branch.controller.js";

const router = Router();

// All branch routes require ADMIN role
router.use(authenticate, authorizeRoles("ADMIN"));

/* ===========================
   CREATE BRANCH
=========================== */
router.post("/", createBranch);

/* ===========================
   LIST ALL MY BRANCHES
=========================== */
router.get("/", listMyBranches);

/* ===========================
   GET SINGLE BRANCH (By ID)
=========================== */
router.get("/:id", getBranchById);

/* ===========================
   UPDATE BRANCH
=========================== */
router.put("/:id", updateBranch);

/* ===========================
   DELETE BRANCH
=========================== */
router.delete("/:id", deleteBranch);

export default router;
